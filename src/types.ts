export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Mode = 'pfp' | 'card';

export interface BadgeDetails {
  name: string;
  handle: string;
  role: string;
  title: string;
  track: string;
  company: string;
}

export interface SharedGraphic {
  id: string;
  mode: Mode;
  imageUrl: string;
  badgeDetails?: BadgeDetails;
  createdAt: number;
}
