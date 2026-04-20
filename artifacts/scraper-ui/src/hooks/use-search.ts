import { useQuery } from "@tanstack/react-query";
import { searchImages, searchVideos, ImageSearchResponse, VideoSearchResponse } from "@/lib/api";

export function useImageSearch(query: string, enabled: boolean, count?: number) {
  return useQuery<ImageSearchResponse, Error>({
    queryKey: ["images", query, count],
    queryFn: () => searchImages(query, count),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVideoSearch(query: string, enabled: boolean, count?: number) {
  return useQuery<VideoSearchResponse, Error>({
    queryKey: ["videos", query, count],
    queryFn: () => searchVideos(query, count),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
