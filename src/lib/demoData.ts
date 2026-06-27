import type { ExpeditionRoute } from "@/lib/types";

export const joshuaTreeRoutes: ExpeditionRoute[] = [
  {
    id: "boy-scout-trail",
    name: "Boy Scout Trail Backpacking Option",
    type: "backpacking",
    mileage: "8 to 16 miles depending on entry/exit plan",
    elevation: "roughly 1,100 ft gain",
    summary:
      "A classic Joshua Tree backpacking corridor with wide desert views, optional out-and-back mileage, and a practical weekend pace for an intermediate group.",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Boy+Scout+Trail+Joshua+Tree+National+Park",
    warnings: [
      "No reliable water on route; cache/carry all water before departure.",
      "Exposure is high and shade is sparse.",
      "Backcountry rules and camping zones must be verified with the park."
    ],
    permitNotes:
      "Backcountry registration and current park rules required. This demo uses a placeholder booking."
  },
  {
    id: "california-riding-hiking",
    name: "California Riding and Hiking Trail Segment",
    type: "backpacking",
    mileage: "10 to 18 miles depending on segment",
    elevation: "rolling desert terrain, 900 to 1,600 ft gain",
    summary:
      "A flexible segment-based backpacking option that can be tuned for distance, bailout points, and daylight.",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=California+Riding+and+Hiking+Trail+Joshua+Tree",
    warnings: [
      "Long exposed stretches with limited shade.",
      "Water planning is mission-critical.",
      "Do not enter closed areas or camp outside allowed zones."
    ],
    permitNotes:
      "Confirm current backcountry registration rules, closures, and trailhead logistics with official park alerts."
  },
  {
    id: "pine-city-desert-queen",
    name: "Pine City / Desert Queen Area Day Option",
    type: "fallback-day",
    mileage: "4 to 7 miles",
    elevation: "about 500 to 900 ft gain",
    summary:
      "A conservative fallback for heat, permit uncertainty, or beginner groups that still gets real Joshua Tree terrain and views.",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Pine+City+Trail+Desert+Queen+Mine+Joshua+Tree",
    warnings: [
      "Carry more water than expected even for day travel.",
      "Mine features and closed areas should be viewed from legal, signed routes only.",
      "Fallback does not remove desert heat risk."
    ],
    permitNotes:
      "Day use rules apply; verify parking, closures, and current park guidance."
  }
];

export const defaultOwnedGear = ["backpack", "sleeping bag", "tent", "stove"];

export const joshuaTreePackingList = [
  "Water storage for at least 1 gallon per person per day plus margin",
  "Paper/offline map and charged phone",
  "Headlamp with spare battery",
  "Sun hoodie or sun shirt",
  "Wide-brim hat and sunglasses",
  "First aid kit",
  "Satellite messenger or emergency beacon",
  "Insulating layer for desert night temperatures",
  "Food for planned meals plus one extra meal",
  "Leave No Trace waste kit"
];

export const missingGearCatalog = [
  "satellite messenger",
  "extra water storage",
  "headlamp",
  "sun hoodie",
  "first aid kit"
];
