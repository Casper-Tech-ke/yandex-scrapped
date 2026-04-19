import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ImageGrid } from "@/components/image-grid";
import { VideoGrid } from "@/components/video-grid";
import { useImageSearch, useVideoSearch } from "@/hooks/use-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Image as ImageIcon, Film, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  const [hasSearched, setHasSearched] = useState(false);

  const { 
    data: imagesData, 
    isLoading: isImagesLoading, 
    isError: isImagesError,
    error: imagesError
  } = useImageSearch(query, activeTab === "images" && hasSearched);

  const { 
    data: videosData, 
    isLoading: isVideosLoading, 
    isError: isVideosError,
    error: videosError
  } = useVideoSearch(query, activeTab === "videos" && hasSearched);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setHasSearched(true);
  };

  const isLoading = activeTab === "images" ? isImagesLoading : isVideosLoading;
  const isError = activeTab === "images" ? isImagesError : isVideosError;
  const error = activeTab === "images" ? imagesError : videosError;
  const count = activeTab === "images" ? imagesData?.count : videosData?.count;
  
  const showEmpty = hasSearched && !isLoading && !isError && 
    ((activeTab === "images" && imagesData && imagesData.images.length === 0) || 
     (activeTab === "videos" && videosData && videosData.videos.length === 0));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-2xl font-black tracking-tight text-primary">
              CASPER TECH DEVS
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Image & Video Search Scraper
            </p>
          </div>
          
          <div className="flex-grow w-full max-w-xl">
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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Images
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Film className="h-4 w-4" /> Videos
              </TabsTrigger>
            </TabsList>

            {count !== undefined && !isLoading && !isError && (
              <div className="text-sm text-muted-foreground bg-muted px-4 py-1.5 rounded-full font-medium">
                {count} results found
              </div>
            )}
          </div>

          <TabsContent value="images" className="mt-0">
            {isImagesLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Searching images for "{query}"...</p>
              </div>
            )}

            {isImagesError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {imagesError?.message || "Failed to load images. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {imagesData && imagesData.images.length > 0 && (
              <ImageGrid images={imagesData.images} />
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-0">
            {isVideosLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Searching videos for "{query}"...</p>
                <p className="text-sm mt-2 opacity-70">Video search may take up to 30 seconds to resolve stream qualities.</p>
              </div>
            )}

            {isVideosError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {videosError?.message || "Failed to load videos. Please try again."}
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
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md">
                We couldn't find any {activeTab} matching "{query}". Try adjusting your search terms.
              </p>
            </div>
          )}

          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-4">Ready to search</h2>
                <p>Enter a query above to start scraping high-quality images and videos from across the web.</p>
              </div>
            </div>
          )}
        </Tabs>
      </main>

      <footer className="border-t border-border/40 bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-semibold text-primary">
            Powered by CASPER TECH DEVS
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              Creator:{" "}
              <a 
                href="https://github.com/Casper-Tech-ke" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                TRABY CASPER
              </a>
            </span>
            <span>
              Helped by{" "}
              <a 
                href="https://github.com/kkeizza" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Keith
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

