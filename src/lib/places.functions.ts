import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
});

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  userRatingCount: number | null;
  phone: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
};

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<PlaceResult[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) throw new Error("Google Maps não configurado");

    const textQuery = `${data.query} em ${data.location}`;
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri",
        },
        body: JSON.stringify({ textQuery, languageCode: "pt-BR", regionCode: "BR" }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Places API error", res.status, body);
      throw new Error(`Falha ao buscar (${res.status})`);
    }

    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
        internationalPhoneNumber?: string;
        nationalPhoneNumber?: string;
        websiteUri?: string;
        googleMapsUri?: string;
      }>;
    };

    return (json.places ?? []).map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Sem nome",
      address: p.formattedAddress ?? "",
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      websiteUri: p.websiteUri ?? null,
      googleMapsUri: p.googleMapsUri ?? null,
    }));
  });
