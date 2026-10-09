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
    'I paid $179 including tax for this carry-on; the receipt did not include a separate protective cover. Over six months I used it for eight short trips. On a three-hour airport-and-train transfer, its wheels rolled smoothly across both terminal and station floors, and I could lift the 2.7 kg empty case onto the train. After those trips the shell and handle remain intact. It fit the cabin frame on my flights, although I have not checked every airline.',
    'At the shop my carry-on came to $189 including tax, but a luggage tag was extra. Nine months and ten weekend trips later, the shell, zip and telescoping handle still work. My longest trip from station to hotel lasted four hours; the wheels glided across the terminal and train platform without sticking, and the 2.6 kg empty suitcase was manageable to lift. It fitted my flights overhead; I still check each airline size rule.',
    'I bought this carry-on for $195 total including tax and delivery a year ago; I did not buy any optional add-ons. Since then I have taken it on monthly short trips. During a two-hour rail and airport connection last week, the wheels stayed smooth on station floors and the 2.8 kg empty case was easy to carry up stairs. After a year the handle and shell show no damage. It has fitted the cabin frames used on my flights, but airline limits can differ.',
  ].join('\n\n'),
  zh: [
    '我买这个登机箱时含税付了179美元，但防护套需要另外购买。六个月内我带它短途出行八次。一次从机场转乘火车、历时三小时的路途中，轮子在航站楼和站台地面都滚动顺滑，空箱重2.7公斤，提上火车不费劲。八次出行后箱体和拉杆仍完好。它通过了我乘坐航班的登机尺寸框，不过我没核对过所有航空公司。',
    '店里给我的含税价格是189美元，行李牌另收费。九个月、十次周末旅行后，箱体、拉链和伸缩拉杆都还能正常使用。最长一次从车站到酒店的路程约四小时，轮子在航站楼和火车站站台推起来没有卡顿；2.6公斤的空箱也方便提起。它能放进我乘坐航班的行李架，但我仍会核对各航空公司的尺寸规定。',
    '我一年前以含税、含运费共195美元买了这个登机箱，没有购买额外配件，后来每月带它短途旅行。上周两小时的铁路和机场换乘中，轮子在车站地面依然顺滑，2.8公斤的空箱提上楼梯也方便。一年后拉杆和箱体没有损坏。它符合我乘坐航班的登机尺寸要求，不过不同航空公司可能有不同限制。',
  ].join('\n\n'),
} as const;

export function untouchedExample(value: string, touched: boolean, example: string): string | null {
  return !touched && !value.trim() ? example : null;
}

export function isGuidedCarryOnNeed(need: string): boolean {
  const value = need.trim();
  return Object.values(guidedNeed).some(example => value === example || value.startsWith(`${example}\n`));
}
