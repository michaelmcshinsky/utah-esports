"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@utah-esports/ui";

export type MapPoint = {
  id: string;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  startsAt: string;
  city?: string | null;
};

type LeafletModule = typeof import("react-leaflet");

const UTAH_CENTER: [number, number] = [40.2, -111.7];

/**
 * Leaflet map with OpenStreetMap tiles (no API key). Loaded client-side
 * only; a list alternative is always available via the List view.
 */
export function EventMapView({ points }: { points: MapPoint[] }) {
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("react-leaflet");
        if (cancelled) return;
        setLeaflet(mod);
        await import("leaflet/dist/leaflet.css");
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <EmptyState
        title="Map unavailable"
        description="Use the List view to browse the same events."
      />
    );
  }
  if (!leaflet) {
    return <div className="h-96 animate-pulse rounded-card bg-charcoal-100" aria-hidden />;
  }
  if (points.length === 0) {
    return (
      <EmptyState
        title="No mapped events in these results"
        description="Some events are online or missing coordinates. Switch to List view to see everything."
      />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = leaflet;

  return (
    <div className="overflow-hidden rounded-card border border-charcoal-200">
      <MapContainer
        center={points[0] ? [points[0].lat, points[0].lng] : UTAH_CENTER}
        zoom={10}
        style={{ height: "28rem", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>
              <div>
                <p className="font-medium">{point.title}</p>
                <p className="text-sm">
                  {new Date(point.startsAt).toLocaleDateString()}
                  {point.city ? ` · ${point.city}` : ""}
                </p>
                <Link href={`/events/${point.slug}`}>View details</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
