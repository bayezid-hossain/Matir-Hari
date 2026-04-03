"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Interactive map picker for selecting the kitchen location.
 * Uses Leaflet + OpenStreetMap — no API key required.
 * Click or drag the pin to update coordinates.
 */
export function KitchenMapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current || mapRef.current) return;

    // Leaflet requires dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return;

      // Safety check: if the container already has a leaflet instance, don't re-initialize
      if ((containerRef.current as any)._leaflet_id) return;

      // Fix default marker icons (broken in bundlers)
      const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
      const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
      const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

      const icon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

      const map = L.map(containerRef.current).setView([lat, lng], 16);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      const update = (newLat: number, newLng: number) => {
        onChange(newLat, newLng);
        setAddress(null);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`)
          .then((r) => r.json())
          .then((d) => {
            if (isMounted) setAddress(d.display_name ?? null);
          })
          .catch(() => {});
      };

      marker.on("dragend", () => {
        const { lat: newLat, lng: newLng } = marker.getLatLng();
        update(newLat, newLng);
      });

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        update(newLat, newLng);
      });

      // Initial reverse geocode
      update(lat, lng);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker if lat/lng props change externally (e.g. paste input)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-outline-variant/20"
        style={{ height: 320 }}
      />
      {address && (
        <p className="text-xs text-stone-500 leading-relaxed px-1">
          📍 {address}
        </p>
      )}
      <p className="text-[11px] text-stone-400 px-1">
        Click anywhere on the map or drag the pin to set the kitchen location.
      </p>
    </div>
  );
}
