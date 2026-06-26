export const humanGender = {
  masculine: "masculin",
  feminine: "feminin"
};

export function humanGenderTextVars(gender = humanGender.masculine) {
  const feminine = gender === humanGender.feminine;
  return {
    gender,
    ilElle: feminine ? "elle" : "il",
    IlElle: feminine ? "Elle" : "Il",
    leLa: feminine ? "la" : "le",
    LeLa: feminine ? "La" : "Le",
    luiElle: feminine ? "elle" : "lui",
    sonSa: feminine ? "sa" : "son",
    SonSa: feminine ? "Sa" : "Son",
    accordE: feminine ? "e" : "",
    premierPremiere: feminine ? "première" : "premier"
  };
}
