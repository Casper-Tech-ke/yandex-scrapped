import { ImageResult } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface ImageGridProps {
  images: ImageResult[];
}

export function ImageGrid({ images }: ImageGridProps) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {images.map((image, index) => (
        <div 
          key={index} 
          className="group relative break-inside-avoid overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50"
        >
          <img 
            src={image.url} 
            alt={image.title} 
            className="w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-medium line-clamp-2 text-sm mb-1">{image.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs truncate max-w-[80%]">{image.domain}</span>
              <a 
                href={image.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-primary transition-colors"
                title="Visit source"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
