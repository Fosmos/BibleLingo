export type QuestRidge = "hills" | "dunes" | "peaks" | "waves";
export type QuestDecorKind = "tree" | "palm" | "pine" | "island" | "cedar" | "vine" | "star" | "column";
export type QuestWeather = "motes" | "sand" | "snow" | "clouds" | "embers" | "stars";

export interface QuestBiome {
  name: string;
  ridge: QuestRidge;
  decor: QuestDecorKind;
  weather: QuestWeather;
  skyTop: string;
  skyLow: string;
  sun: string;
  far: string;
  mid: string;
  ground: string;
  groundLow: string;
  road: string;
}

// The lands of the Quest map, in the order you come to them; a long path goes round them again.
export const QUEST_BIOMES: QuestBiome[] = [
  { name: "Green Pastures", ridge: "hills", decor: "tree", weather: "motes", skyTop: "#7cc4e8", skyLow: "#d9f0e6", sun: "#fff3b8", far: "#a3cf9d", mid: "#86bd78", ground: "#6fab5f", groundLow: "#5a964e", road: "#f0dfb4" },
  { name: "The Wilderness", ridge: "dunes", decor: "palm", weather: "sand", skyTop: "#f2a65a", skyLow: "#fbe3b0", sun: "#fff1c9", far: "#e7bf82", mid: "#dcaa67", ground: "#cf9650", groundLow: "#b98040", road: "#f6e6c3" },
  { name: "The High Places", ridge: "peaks", decor: "pine", weather: "snow", skyTop: "#6f8fb5", skyLow: "#d7e3ee", sun: "#f6f9ff", far: "#a9bccf", mid: "#7f97ad", ground: "#62798f", groundLow: "#4e6479", road: "#dfe7ee" },
  { name: "The Great Sea", ridge: "waves", decor: "island", weather: "clouds", skyTop: "#4aa3cf", skyLow: "#c6eaef", sun: "#fff6cf", far: "#57a9c2", mid: "#3d8eab", ground: "#2c7796", groundLow: "#21627f", road: "#e9dcb3" },
  { name: "Cedars of Lebanon", ridge: "hills", decor: "cedar", weather: "motes", skyTop: "#39705f", skyLow: "#a9d0a8", sun: "#eef5c0", far: "#3f7d60", mid: "#2f6a50", ground: "#25583f", groundLow: "#1c4732", road: "#c9b98a" },
  { name: "The Vineyard", ridge: "hills", decor: "vine", weather: "embers", skyTop: "#b5597a", skyLow: "#f7c9a3", sun: "#ffe2a6", far: "#a9708c", mid: "#8b5574", ground: "#74445f", groundLow: "#5f364e", road: "#ecd3b8" },
  { name: "The Night Watch", ridge: "peaks", decor: "star", weather: "stars", skyTop: "#10163a", skyLow: "#39447e", sun: "#f3f1d8", far: "#2c3568", mid: "#222a57", ground: "#1b2148", groundLow: "#13183a", road: "#a9afd9" },
  { name: "The Golden City", ridge: "dunes", decor: "column", weather: "embers", skyTop: "#e0a93b", skyLow: "#fff0c2", sun: "#fffbe6", far: "#e6c678", mid: "#d6ae5c", ground: "#c49743", groundLow: "#a97e33", road: "#fff3cf" },
];
