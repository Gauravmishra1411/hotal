export interface HotelBasicInfo {
  hotelName: string;
  slug: string;
  shortDescription: string;
  description: string;
  starRating: number;
  featured: boolean;
  status: 'active' | 'inactive';
}

export interface HotelContactInfo {
  ownerName: string;
  email: string;
  phone: string;
  website: string;
}

export interface HotelLocationDetails {
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  googleMapLink: string;
}

export interface HotelPricingInfo {
  pricePerNight: string;
  currency: string;
}

export interface HotelRoomInfo {
  roomTypes: string[];
  availableRooms: number;
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
}

export interface HotelAmenities {
  wifiAvailable: boolean;
  parkingAvailable: boolean;
  breakfastIncluded: boolean;
  restaurant: boolean;
  gym: boolean;
  swimmingPool: boolean;
  airConditioning: boolean;
  petFriendly: boolean;
  barLounge: boolean;
  waterParkOffsite: boolean;
  kidsStayFree: boolean;
  babysitting: boolean;
  amenities: string[];
}

export interface HotelRoomFeatures {
  allergyFreeRoom: boolean;
  blackoutCurtains: boolean;
  airConditioningRoom: boolean;
  desk: boolean;
  diningArea: boolean;
  coffeeTeaMaker: boolean;
  cableSatelliteTV: boolean;
  bidet: boolean;
}

export interface HotelDetailedRoomTypes {
  cityView: boolean;
  poolView: boolean;
  bridalSuite: boolean;
  suites: boolean;
  familyRooms: boolean;
  smokingRooms: boolean;
}

export interface HotelGoodToKnow {
  hotelClass: number; // e.g., 4, 5
  hotelStyle: string; // e.g., "Charming, Classic"
  languagesSpoken: string; // e.g., "English, Hindi"
}

export interface HotelMedia {
  thumbnail: string;
  galleryImages: string[];
  videoUrl: string;
}

export interface HotelRatings {
  averageRating: number;
  totalReviews: number;
  ratingLocation: number;
  ratingRooms: number;
  ratingValue: number;
  ratingCleanliness: number;
  ratingService: number;
  ratingSleepQuality: number;
  rankingText: string; // e.g., "#1 of 163 hotels in Noida"
}

export interface HotelSystemInfo {
  hotelId?: string; // Optional because it's set after creation or is the document ID
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel extends 
  HotelBasicInfo, 
  HotelContactInfo, 
  HotelLocationDetails, 
  HotelPricingInfo, 
  HotelRoomInfo, 
  HotelAmenities,
  HotelRoomFeatures,
  HotelDetailedRoomTypes,
  HotelGoodToKnow,
  HotelMedia, 
  HotelRatings, 
  HotelSystemInfo {}
