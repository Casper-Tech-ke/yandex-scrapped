import { useQuery } from "@tanstack/react-query";
import { searchImages, searchVideos, ImageSearchResponse, VideoSearchResponse } from "@/lib/api";

export function useImageSearch(query: string, enabled: boolean) {
  return useQuery<ImageSearchResponse, Error>({
    queryKey: ["images", query],
    queryFn: () => searchImages(query),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useVideoSearch(query: string, enabled: boolean) {
  return useQuery<VideoSearchResponse, Error>({
    queryKey: ["videos", query],
    queryFn: () => searchVideos(query),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
