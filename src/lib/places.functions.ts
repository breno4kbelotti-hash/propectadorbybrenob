import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  onlyWithoutWebsite: z.boolean().optional(),
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

const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,nextPageToken";

type PlacesResponse = {
  nextPageToken?: string;
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

async function callPlaces(
  lovableKey: string,
  gmKey: string,
  body: Record<string, unknown>,
): Promise<PlacesResponse> {
  const res = await fetch(
    "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    console.error("Places API error", res.status, t);
    throw new Error(`Falha ao buscar (${res.status})`);
  }
  return (await res.json()) as PlacesResponse;
}

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<PlaceResult[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) throw new Error("Google Maps não configurado");

    const textQuery = `${data.query} em ${data.location}`;
    const baseBody = { textQuery, languageCode: "pt-BR", regionCode: "BR", pageSize: 20 };

    const all: NonNullable<PlacesResponse["places"]> = [];
    let pageToken: string | undefined = undefined;

    // Até 4 páginas (~80 resultados max). Paramos quando não houver nextPageToken.
    for (let i = 0; i < 4; i++) {
      const body: Record<string, unknown> = { ...baseBody };
      if (pageToken) body.pageToken = pageToken;
      let resp: PlacesResponse;
      try {
        resp = await callPlaces(lovableKey, gmKey, body);
      } catch (err) {
        if (i === 0) throw err;
        break;
      }
      if (resp.places) all.push(...resp.places);
      if (!resp.nextPageToken) break;
      pageToken = resp.nextPageToken;
      // Google exige um pequeno delay antes do próximo pageToken ficar ativo.
      await new Promise((r) => setTimeout(r, 1600));
      if (all.length >= 80) break;
    }

    const mapped = all.slice(0, 80).map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Sem nome",
      address: p.formattedAddress ?? "",
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      websiteUri: p.websiteUri ?? null,
      googleMapsUri: p.googleMapsUri ?? null,
    }));

    return data.onlyWithoutWebsite ? mapped.filter((p) => !p.websiteUri) : mapped;
  });

