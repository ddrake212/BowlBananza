// shaders.ts

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  // Hash function for random noise (vec2 -> float)
  float hash(vec2 p) {
      float h = dot(p, vec2(127.1, 311.7));
      return fract(sin(h) * 43758.5453123);
  }

  // Smooth Interpolation
  vec3 softMix(vec3 c1, vec3 c2, float t) {
      return mix(c1, c2, smoothstep(0.0, 1.0, t));
  }

  void main() {
    // 1. Core Gradient Logic
    // Shift the UV slightly over time for the subtle motion
    vec2 shiftedUv = vUv + sin(uTime * 0.05) * 0.1; 
    
    // Normalized position from bottom-left (0,0) to top-right (1,1)
    float horizontalMix = shiftedUv.x * 0.7 + 0.3; // Bias towards color B/C
    float verticalMix = shiftedUv.y;
    
    // Interpolate ColorA (Charcoal) with ColorB (Deep Slate)
    vec3 colorAB = softMix(uColorA, uColorB, horizontalMix);

    // Interpolate result with ColorC (Muted Steel) based on vertical position
    vec3 baseColor = softMix(colorAB, uColorC, verticalMix * verticalMix);

    // 2. Gentle Light Bloom (Upper Right Corner)
    // Create a vector pointing from center to upper-right (1,1)
    vec2 lightSource = vec2(1.0, 1.0);
    vec2 diff = lightSource - vUv;
    
    // Calculate distance, scaled and smoothed
    float dist = length(diff * vec2(2.0, 2.0)); // Scale to make the bloom larger
    float bloom = smoothstep(2.0, 0.0, dist); // Bloom intensity falls off quickly
    
    // Apply bloom with a subtle steel-like tint
    vec3 bloomColor = vec3(0.1, 0.2, 0.35) * bloom * 0.7; // Muted color and intensity

    // Final color before noise
    vec3 finalColor = baseColor + bloomColor;


    // 3. Very Subtle Film Grain Noise (8% opacity)
    vec2 p = gl_FragCoord.xy / 200.0; // Scale the noise texture
    float noise = hash(p * uTime); // Time-based movement
    
    // Apply the noise as a subtle overlay
    // Noise adds a slight brightness/darkness variation (0.5 to 1.5)
    float noiseIntensity = 0.08; // 8% opacity
    finalColor += (noise - 0.5) * noiseIntensity; 


    gl_FragColor = vec4(finalColor, 1.0);
  }
`;