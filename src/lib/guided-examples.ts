export const guidedNeed = {
  en: 'I need a lightweight carry-on under $200 for short trips.\nDurability and smooth wheels matter most.',
  zh: '我想买一个适合短途旅行的轻便登机箱，预算200美元以内，最在意耐用和轮子顺滑。',
} as const;

export const guidedClarification = {
  en: 'Use only the product and priorities I stated. Keep missing details unknown.',
  zh: '请只根据我已说明的商品和重点继续，未说明的细节保留为未知。',
} as const;

// Prepared synthetic validation reviews, based on the carry-on live regression.
// The label shown in the UI is separate from review text so citations stay exact.
export const guidedReviews = {
  en: [
    'I paid $179 for this carry-on suitcase and have used it on eight short trips in six months. It weighs 2.7 kg empty. Its wheels rolled smoothly through airports and train stations on every trip, and the shell and handle remain intact. It fit the cabin sizing frame on my flights.',
    'My carry-on suitcase cost $189. After ten weekend trips over nine months, its shell and wheels still work well. The wheels glide smoothly across terminal floors and train platforms, and lifting the 2.6 kg empty case onto trains is manageable. It fitted the overhead cabin space on my flights; I still check each airline size rule.',
    'I bought this carry-on for $195 and have used it for short trips for a year. The 2.8 kg empty case is easy to lift, its wheels still roll smoothly on station floors, and its handle and shell show no damage. It has fitted the cabin frames used on my flights, but airline limits can differ.',
  ].join('\n\n'),
  zh: [
    '我花179美元买了这个登机箱，六个月里带它短途出行八次。空箱重2.7公斤，在机场和火车站推行时轮子一直很顺滑，箱体和拉杆目前完好。它在我乘坐的航班上通过了登机尺寸框。',
    '我的登机箱售价189美元，九个月里用于十次周末短途旅行。箱体和轮子仍然完好；轮子在航站楼地面和火车站站台推起来很顺畅。空箱重2.6公斤，搭火车时提起不费劲。它在我的航班上能放进行李架，但我仍会核对各航空公司的尺寸规定。',
    '我以195美元购买这个登机箱，已经用于一年的短途旅行。空箱重2.8公斤，方便提起；轮子在车站地面仍滚动顺滑，拉杆和箱体没有损坏。它符合我乘坐航班的登机尺寸要求，不过不同航空公司可能有不同限制。',
  ].join('\n\n'),
} as const;

export function untouchedExample(value: string, touched: boolean, example: string): string | null {
  return !touched && !value.trim() ? example : null;
}

export function isGuidedCarryOnNeed(need: string): boolean {
  const value = need.trim();
  return Object.values(guidedNeed).some(example => value === example || value.startsWith(`${example}\n`));
}
