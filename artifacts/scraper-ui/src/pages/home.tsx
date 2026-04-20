import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { ImageGrid } from "@/components/image-grid";
import { VideoGrid } from "@/components/video-grid";
import { Footer } from "@/components/footer";
import { NavDropdown } from "@/components/nav-dropdown";
import { ImageSkeletonGrid, VideoSkeletonGrid } from "@/components/skeleton-grid";
import { useImageSearch, useVideoSearch } from "@/hooks/use-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon,
  Film,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FEATURED_IMAGE_QUERY = "nature";
const FEATURED_VIDEO_QUERY = "music";

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  const [hasSearched, setHasSearched] = useState(false);

  // User search results (only fired after a search)
  const {
    data: searchImagesData,
    isLoading: isSearchImagesLoading,
    isError: isSearchImagesError,
    error: searchImagesError,
  } = useImageSearch(query, activeTab === "images" && hasSearched);

  const {
    data: searchVideosData,
    isLoading: isSearchVideosLoading,
    isError: isSearchVideosError,
    error: searchVideosError,
  } = useVideoSearch(query, activeTab === "videos" && hasSearched);

  // Featured content — always loaded on mount, capped at fewer items for speed
  const { data: featuredImages, isLoading: isFeaturedImagesLoading } =
    useImageSearch(FEATURED_IMAGE_QUERY, !hasSearched || activeTab === "images", 18);

  const { data: featuredVideos, isLoading: isFeaturedVideosLoading } =
    useVideoSearch(FEATURED_VIDEO_QUERY, !hasSearched || activeTab === "videos", 6);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setHasSearched(true);
  };

  const handleTabChange = useCallback((tab: "images" | "videos") => {
    setActiveTab(tab);
  }, []);

  // Which data to actually display
  const imagesData = hasSearched ? searchImagesData : featuredImages;
  const videosData = hasSearched ? searchVideosData : featuredVideos;

  const isImagesLoading = hasSearched
    ? isSearchImagesLoading
    : isFeaturedImagesLoading;
  const isVideosLoading = hasSearched
    ? isSearchVideosLoading
    : isFeaturedVideosLoading;
  const isImagesError = hasSearched ? isSearchImagesError : false;
  const isVideosError = hasSearched ? isSearchVideosError : false;
  const imagesError = hasSearched ? searchImagesError : null;
  const videosError = hasSearched ? searchVideosError : null;

  const isLoading = activeTab === "images" ? isImagesLoading : isVideosLoading;
  const isError = activeTab === "images" ? isImagesError : isVideosError;
  const error = activeTab === "images" ? imagesError : videosError;
  const count =
    activeTab === "images" ? imagesData?.count : videosData?.count;

  const showEmpty =
    hasSearched &&
    !isLoading &&
    !isError &&
    ((activeTab === "images" &&
      imagesData &&
      imagesData.images.length === 0) ||
      (activeTab === "videos" &&
        videosData &&
        videosData.videos.length === 0));

  const isFeatured = !hasSearched;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Top row on mobile: menu + brand */}
          <div className="flex items-center gap-3 shrink-0">
            <NavDropdown onTabChange={handleTabChange} />
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-black tracking-tight text-primary leading-none">
                CASPER TECH DEVS
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Image & Video Scraper
              </p>
            </div>
          </div>

          {/* Search bar — full width on mobile, grows on desktop */}
          <div className="w-full sm:flex-grow">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs
          defaultValue="images"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "images" | "videos")}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Images
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Film className="h-4 w-4" /> Videos
              </TabsTrigger>
            </TabsList>

            {isFeatured && !isLoading && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-4 py-1.5 rounded-full font-medium border border-border/30">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                Featured
              </div>
            )}

            {!isFeatured && count !== undefined && !isLoading && !isError && (
              <div className="text-sm text-muted-foreground bg-muted px-4 py-1.5 rounded-full font-medium">
                {count} results found
              </div>
            )}
          </div>

          {/* Images tab */}
          <TabsContent value="images" className="mt-0">
            {isImagesLoading && (
              isFeatured
                ? <ImageSkeletonGrid count={18} />
                : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p>Searching images for "{query}"…</p>
                  </div>
                )
            )}

            {isImagesError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {imagesError?.message ||
                    "Failed to load images. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {imagesData && imagesData.images.length > 0 && (
              <ImageGrid images={imagesData.images} />
            )}
          </TabsContent>

          {/* Videos tab */}
          <TabsContent value="videos" className="mt-0">
            {isVideosLoading && (
              isFeatured
                ? <VideoSkeletonGrid count={6} />
                : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p>Searching videos for "{query}"…</p>
                    <p className="text-sm mt-2 opacity-70">
                      Video search may take up to 30 seconds to resolve stream qualities.
                    </p>
                  </div>
                )
            )}

            {isVideosError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {videosError?.message ||
                    "Failed to load videos. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {videosData && videosData.videos.length > 0 && (
              <VideoGrid videos={videosData.videos} />
            )}
          </TabsContent>

          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any {activeTab} matching "{query}". Try
                adjusting your search terms.
              </p>
            </div>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
