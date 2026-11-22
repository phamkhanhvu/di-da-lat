import { normalizeSearch } from './templates.mjs';
import { placeGuides } from './place-guides.mjs';

const canonicalPlaces = {
  "zen-valley-da-lat": "zen-valley-dalat-resort",
  "fungi-chingu-cho-dem": "fungi-chingu"
};

function streetOf(address) {
  const match = address.match(/^\s*(?:(?:số|hẻm)\s+)?\d+[a-z]?(?:\s*bis)?(?:[\/–-]\d+[a-z]?)*\s+(?:đường\s+)?([^,·]+)/i);
  if (!match) return '';
  const street = normalizeSearch(match[1].split(/\s[-–]\s/)[0]);
  return /\b(thôn|tổ|khu|phường)\b/i.test(match[1]) ? '' : street;
}

function addressText(address) {
  return address.replace(/,?\s*Lâm Đồng\s*$/i, '').trim().replace(/[,–-]+$/, '').trim();
}

function listingType(place) {
  const description = normalizeSearch(place.desc);
  if (/quan ca phe|diem dung ca phe/.test(description)) return 'quán cà phê';
  if (/dac san/.test(description)) return 'địa chỉ mua đặc sản';
  if (/cam trai/.test(description)) return 'điểm cắm trại';
  if (place.cat === 'Lưu trú') return 'địa chỉ lưu trú';
  if (place.cat === 'Ẩm thực') return 'địa chỉ ăn uống';
  if (place.cat === 'Văn hóa') return 'điểm văn hóa';
  return 'điểm tham quan';
}

function listingDirections(place) {
  const address = addressText(place.address);
  if (/^[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,3}\b/i.test(address)) {
    return 'Địa chỉ có mã vị trí. Giữ nguyên mã khi nhập vào bản đồ và kiểm tra đường vào trước khi xuất phát.';
  }
  if (/^\s*(?:hẻm|ngõ)\s/i.test(address) || /^\s*(?:số\s+)?\d+[a-z]?\/\d/i.test(address)) {
    return 'Theo ghim vào đúng nhánh hẻm của địa chỉ. Nếu đi ô tô, hỏi điểm xuống xe ở đầu hẻm và chặng đi bộ còn lại.';
  }
  if (streetOf(address)) {
    return 'Mở Chỉ đường, đối chiếu số nhà hoặc số lô với ghim. Nếu bản đồ hiện nhiều kết quả, chọn ghim có cùng địa chỉ.';
  }
  return 'Mở Chỉ đường để xác định ghim. Khi thông tin chỉ ghi khu vực, hỏi điểm vào cụ thể trước khi đặt xe.';
}

export function applyPlaceGuides(places) {
  const prepared = places.map(place => {
    const canonicalId = canonicalPlaces[place.id];
    const guide = placeGuides[canonicalId ?? place.id];
    if (!guide) return place;
    const { address, related, timing, tickets, ticketNote, duration, ...editorial } = guide;
    return {
      ...place,
      editorial,
      canonicalId,
      desc: editorial.summary,
      ...(address ? { address, where: address, mapQuery: place.name + ', ' + address } : {}),
      ...(related ? { related } : {}),
      ...(timing ? { timing } : {}),
      ...(tickets ? { tickets } : {}),
      ...(ticketNote ? { ticketNote } : {}),
      ...(duration ? { duration } : {})
    };
  });
  const onStreet = new Map();
  for (const place of prepared) {
    const street = streetOf(place.address);
    if (!street) continue;
    if (!onStreet.has(street)) onStreet.set(street, []);
    onStreet.get(street).push(place);
  }
  return prepared.map(place => {
    if (place.editorial) return place;
    const listingLead = place.name + ' là ' + listingType(place) + ' tại ' +
      addressText(place.address) + '.';
    const street = streetOf(place.address);
    const streetPeers = street ? onStreet.get(street)
      .filter(next => next.id !== place.id && normalizeSearch(addressText(next.address)) !== normalizeSearch(addressText(place.address)) &&
        (!place.area || !next.area || place.area === next.area))
      .sort((a, b) => Number(b.cat !== place.cat) - Number(a.cat !== place.cat))
      .slice(0, 2) : [];
    return {
      ...place,
      listingLead,
      listingOverview: place.intro,
      plan: listingDirections(place),
      ...(streetPeers.length ? { sameStreet: true, related: streetPeers.map(next => next.id) } : {})
    };
  });
}
