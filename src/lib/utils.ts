import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Standard shadcn class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format duration from seconds to HH:MM:SS or MM:SS
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format date to local YYYY-MM-DD
export function formatDate(date: Date | null): string {
  if (!date) return '-';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format percent decimal (e.g. 0.85 -> 85.0%)
export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

// Format raw number with comma separation
export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString();
}
