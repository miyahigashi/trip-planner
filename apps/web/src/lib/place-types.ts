// apps/web/src/lib/place-types.ts
export const PLACE_TYPE_LABELS_JA: Record<string, string> = {
  // 食・カフェ
  restaurant: "レストラン",
  cafe: "カフェ",
  bar: "バー",
  bakery: "ベーカリー",
  meal_takeaway: "テイクアウト",
  meal_delivery: "デリバリー",
  food: "飲食店",
  grocery_or_supermarket: "スーパーマーケット",
  convenience_store: "コンビニ",
  liquor_store: "酒屋",

  // 買い物
  shopping_mall: "ショッピングモール",
  department_store: "デパート",
  clothing_store: "衣料品店",
  shoe_store: "靴屋",
  jewelry_store: "宝飾店",
  book_store: "書店",
  electronics_store: "家電量販店",
  home_goods_store: "雑貨・インテリア",
  furniture_store: "家具店",
  hardware_store: "ホームセンター",
  pharmacy: "ドラッグストア",
  store: "小売店",

  // 観光・文化
  tourist_attraction: "観光名所",
  museum: "博物館",
  art_gallery: "美術館",
  aquarium: "水族館",
  zoo: "動物園",
  amusement_park: "遊園地",
  movie_theater: "映画館",
  library: "図書館",
  park: "公園",
  natural_feature: "自然スポット",
  campground: "キャンプ場",

  // 宿泊・温浴・運動
  lodging: "宿泊施設",
  spa: "スパ",
  gym: "ジム・フィットネス",

  // 美容・ヘルス
  beauty_salon: "美容室・サロン",
  hair_care: "ヘアケア",
  dentist: "歯科",
  doctor: "クリニック",
  hospital: "病院",
  health: "ヘルスケア",

  // 交通
  train_station: "鉄道駅",
  subway_station: "地下鉄駅",
  bus_station: "バス停",
  transit_station: "交通ハブ",
  airport: "空港",
  parking: "駐車場",
  gas_station: "ガソリンスタンド",
  car_rental: "レンタカー",
  car_repair: "自動車修理",
  car_wash: "洗車",
  bicycle_store: "自転車店",

  // 行政・生活
  post_office: "郵便局",
  police: "警察",
  city_hall: "市役所・役場",
  courthouse: "裁判所",
  embassy: "大使館",
  school: "学校",
  university: "大学",
  place_of_worship: "宗教施設",
  church: "教会",
  mosque: "モスク",
  hindu_temple: "ヒンドゥー寺院",
  synagogue: "シナゴーグ",

  // 汎用（よく付く）
  point_of_interest: "スポット",
  establishment: "施設",
};

// 未定義の型はスネークケースを空白にしてそのまま返す（安全なフォールバック）
export function typeToJa(t: string): string {
  return PLACE_TYPE_LABELS_JA[t] ?? t.replaceAll("_", " ");
}
