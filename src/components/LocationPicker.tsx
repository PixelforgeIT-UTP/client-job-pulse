// components/LocationPicker.tsx
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { useEffect, useRef } from "react";

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

export function LocationPicker({ value, onChange, onCoordinatesChange }: LocationPickerProps) {
  const geocoderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!geocoderRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      types: "address",
      placeholder: "Enter a full address",
      marker: false,
    });

    geocoderRef.current.innerHTML = "";
    geocoder.addTo(geocoderRef.current);

    geocoder.on("result", (e) => {
      const place = e.result;
      onChange(place.place_name);
      if (onCoordinatesChange) {
        onCoordinatesChange(place.geometry.coordinates[1], place.geometry.coordinates[0]); // lat, lng
      }
    });

    return () => geocoder.clear();
  }, []);

  return <div ref={geocoderRef} className="w-full" />;
}
