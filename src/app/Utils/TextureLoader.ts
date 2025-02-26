// src/app/utils/TextureLoader.ts
import * as THREE from 'three';

/**
 * Create a robust texture loader that handles path resolution properly
 * for Next.js applications
 */
export class EnhancedTextureLoader {
  private loader: THREE.TextureLoader;
  private textureCache: Map<string, THREE.Texture>;
  private baseUrl: string;

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textureCache = new Map<string, THREE.Texture>();
    
    // Make sure we're in a browser environment
    if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = '';
    }
  }

  /**
   * Load a texture with path resolution and caching
   */
  public load(path: string): THREE.Texture {
    // Check cache first
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }

    // Normalize path - ensure it starts with a slash
    let normalizedPath = path;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
    // Remove any duplicate slashes
    normalizedPath = normalizedPath.replace(/\/+/g, '/');
    
    // Create a fallback texture (color) in case loading fails
    const defaultTexture = this.createDefaultTexture();
    
    // Load the actual texture
    try {
      const texture = this.loader.load(
        normalizedPath,
        (loadedTexture) => {
          console.log(`Loaded texture: ${normalizedPath}`);
          this.textureCache.set(path, loadedTexture);
        },
        undefined, // onProgress callback
        (error) => {
          console.error(`Error loading texture ${normalizedPath}:`, error);
        }
      );
      
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${normalizedPath}:`, error);
      return defaultTexture;
    }
  }

  /**
   * Create a default colored texture as fallback
   */
  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#888888';
      context.fillRect(0, 0, 64, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

// Create a singleton instance of the loader
export const textureLoader = new EnhancedTextureLoader();

/**
 * Helper function to load planet textures consistently
 * @param planetName The name of the planet
 * @returns The loaded texture
 */
export function loadPlanetTexture(planetName: string): THREE.Texture {
  const lowerName = planetName.toLowerCase();
  return textureLoader.load(`/assets/images/${lowerName}.jpeg`);
}