'use server';

import {
  Message,
  OpenAIStream,
  experimental_StreamData,
  experimental_StreamingReactResponse,
} from 'ai';
import { experimental_buildOpenAIMessages } from 'ai/prompts';
import OpenAI from 'openai';
import api from './serp-api';
import StarRating from './components/StarRating';

async function getGoogleRestaurantSuggestions(
  searchTerm: string,
  location: string
) {
  const googleLocalResponse = await api(
    'google_local',
    searchTerm,
    location,
    process.env.SERP_API_KEY as string
  );
  return googleLocalResponse;
}

async function getYelpRestaurantSuggestions(args: {
  cuisine: string;
  location: string;
  cflt?: string;
  sortby?: string;
  attrs?: string[];
}) {
  const { cuisine, location, cflt, sortby, attrs } = args;

  return await api(
    'yelp',
    cuisine,
    location,
    process.env.SERP_API_KEY as string,
    cflt,
    sortby,
    attrs
  );
}

type GPSCoordinates = {
  latitude: number;
  longitude: number;
};

type Suggestion = {
  position: number;
  rating: number;
  reviews_original: string;
  reviews: number;
  price: string;
  description: string;
  place_id: string;
  place_id_search: string;
  lsig: string;
  thumbnail: string;
  gps_coordinates: GPSCoordinates;
  title: string;
  type: string;
  address: string;
  hours: string;
};

const functions = [
  {
    name: 'get_restaurant_suggestions_google',
    description: 'Get restaurant suggestions from Google based on cuisine type',
    parameters: {
      type: 'object',
      properties: {
        cuisine: {
          type: 'string',
          description: 'Type of cuisine, e.g., Italian, Vegan',
        },
        location: {
          type: 'string',
          description:
            'Zip code or city area for the restaurant search, e.g., 98104 or Seattle',
        },
      },
      required: ['cuisine', 'location'],
    },
  },
  {
    name: 'get_restaurant_suggestions_yelp',
    description: 'Get restaurant suggestions from Yelp based on cuisine type',
    parameters: {
      type: 'object',
      properties: {
        cuisine: {
          type: 'string',
          description: 'Type of cuisine, e.g., Italian, Vegan',
        },
        location: {
          type: 'string',
          description:
            'Zip code or city area for the restaurant search, e.g., 98104 or Seattle',
        },
        cflt: {
          type: 'string',
          description: 'Category filter, e.g., bars, restaurants',
        },
        sortby: {
          type: 'string',
          description: 'Sorting criteria, e.g., rating, review_count',
        },
        attrs: {
          type: 'array',
          description:
            'Additional attributes for filtering, e.g., price, features',
          items: {
            type: 'string',
          },
        },
      },
      required: ['cuisine', 'location'],
    },
  },
];

export async function handler({ messages }: { messages: Message[] }) {
  const data = new experimental_StreamData();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: experimental_buildOpenAIMessages(messages),
    functions,
  });

  const stream = OpenAIStream(response, {
    onFinal() {
      data.close();
    },
    async experimental_onFunctionCall({ name, arguments: args }) {
      switch (name) {
        case 'get_restaurant_suggestions_google': {
          const { cuisine, location } = args;

          // Mock function to get restaurant suggestions from Google
          const suggestions = await getGoogleRestaurantSuggestions(
            cuisine as string,
            location as string
          );

          suggestions?.local_results?.forEach((suggestion: Suggestion) => {
            data.append({
              type: 'bubble_option',
              title: suggestion.title,
              value: suggestion.place_id,
              price: suggestion.price,
              rating: suggestion.rating,
              reviews: suggestion.reviews,
              hours: suggestion.hours,
              place_id: suggestion.place_id,
            });
          });

          const results = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            stream: true,
            messages: experimental_buildOpenAIMessages([
              {
                id: '1',
                content: `${JSON.stringify(data)} I searched for ${cuisine} in ${location}, pick only the top 2 restaurants, remember the results details have already been displayed, pick the best options based on the data. Don't include any additional data only the names of restaurants in 1 sentence reply.`,
                role: 'user',
              },
            ]),
          });

          return results;
        }
        case 'get_restaurant_suggestions_yelp': {
          const { cuisine, location, cflt, sortby, attrs } = args;

          // Fetching restaurant suggestions from Yelp
          const suggestions = await getYelpRestaurantSuggestions({
            cuisine: cuisine as string,
            location: location as string,
            cflt: cflt as string | undefined, // Optional
            sortby: sortby as string | undefined, // Optional
            attrs: attrs as string[] | undefined, // Optional
          });

          // Processing the organic results from the Yelp API response
          suggestions?.organic_results?.forEach((suggestion: any) => {
            data.append({
              type: 'bubble_option',
              title: suggestion.title,
              value: suggestion.place_ids?.[0], // Using the first place_id as the identifier
              price: suggestion.price,
              rating: suggestion.rating,
              reviews: suggestion.reviews,
              categories: suggestion.categories
                ?.map((cat: any) => cat.title)
                .join(', '),
              neighborhoods: suggestion.neighborhoods,
              phone: suggestion.phone,
              snippet: suggestion.snippet,
              service_options: suggestion.service_options,
              thumbnail: suggestion.thumbnail,
            });
          });

          const results = await openai.chat.completions.create({
            model: 'gpt-4',
            stream: true,
            messages: experimental_buildOpenAIMessages([
              {
                id: '1',
                content: `${JSON.stringify(data)} I searched for ${cuisine} in ${location}, pick only the top 2 restaurants, remember the results details have already been displayed, pick the best options based on the data. Don't include any additional data only the names of restaurants in 1 sentence reply. Explain why as concisely as possible.`,
                role: 'user',
              },
            ]),
          });

          return results;
        }
      }

      return undefined;
    },

    experimental_streamData: true,
  });

  return new experimental_StreamingReactResponse(stream, {
    data,
    ui({ content, data }: any) {
      if (data?.[0]?.type === 'bubble_option') {
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.map(
                (
                  option: {
                    thumbnail: string;
                    title: string;
                    price: string;
                    rating: number;
                    reviews: number;
                    hours: string;
                  },
                  index: React.Key
                ) => (
                  <div
                    key={index}
                    className="relative flex flex-col rounded overflow-hidden shadow-lg bg-white"
                  >
                    <div className="flex-grow p-4 flex flex-col">
                      <div>
                        <div className="text-gray-700 font-bold text-xl mb-2">
                          {option.title}
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="text-gray-700 text-base mb-2">
                          <span className="inline-block flex items-center">
                            <span className="mr-1">{option.rating}</span>
                            <StarRating rating={option.rating} />
                            <span className="mr-1">({option.reviews})</span>
                            <span className="mr-1">{option.price}</span>
                          </span>
                        </div>
                        {option.hours ? (
                          <div className="bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
                            {option.hours}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            <div>{content}</div>
          </>
        );
      }

      return <div>{content}</div>;
    },
  });
}
