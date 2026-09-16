"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { timKiem, type KetQua } from "@/lib/tim-kiem";
import { cn } from "@/lib/cn";

const NHAN: Record<KetQua["loai"], string> = {
  hoc_vien: "Học viên",
  giao_vien: "Giáo viên",
  lop: "Lớp",
};

/**
 * Ô tìm kiếm toàn cục, đặt ngay dưới tên trung tâm ở mọi trang.
 *
 * Gõ tên học viên, giáo viên hay lớp là ra, Enter để mở kết quả đầu tiên.
 * Không cần nhớ thông tin nằm ở phân hệ nào.
 *
 * Chờ 250ms sau phím cuối mới gọi máy chủ: gõ "Nguyễn" là 6 ký tự, không chờ
 * thì thành 6 lượt truy vấn cho một lần tìm.
 */
export function TimKiem() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [ketQua, setKetQua] = useState<KetQua[]>([]);
  const [mo, setMo] = useState(false);
  const [chon, setChon] = useState(0);
  const [dangChay, batDau] = useTransition();
  const router = useRouter();
  const boc = useRef<HTMLDivElement>(null);
  // Kết quả về không đúng thứ tự gửi đi thì lần gõ cũ có thể ghi đè lần mới.
  const luot = useRef(0);

  useEffect(() => {
    if (tuKhoa.trim().length < 2) {
      setKetQua([]);
      return;
    }
    const cua_toi = ++luot.current;
    const hen = setTimeout(() => {
      batDau(async () => {
        const ra = await timKiem(tuKhoa);
        if (cua_toi === luot.current) {
          setKetQua(ra);
          setChon(0);
          setMo(true);
        }
      });
    }, 250);
    return () => clearTimeout(hen);
  }, [tuKhoa]);

  // Bấm ra ngoài thì đóng bảng kết quả.
  useEffect(() => {
    const ngoai = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener("mousedown", ngoai);
    return () => document.removeEventListener("mousedown", ngoai);
  }, []);

  const diToi = (k: KetQua) => {
    setMo(false);
    setTuKhoa("");
    setKetQua([]);
    router.push(k.duong_dan);
  };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setMo(false);
    if (!ketQua.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setChon((c) => (c + 1) % ketQua.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setChon((c) => (c - 1 + ketQua.length) % ketQua.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      diToi(ketQua[chon]);
    }
  };

  const khongThay =
    mo && !dangChay && tuKhoa.trim().length >= 2 && ketQua.length === 0;

  return (
    <div ref={boc} className="relative px-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-navy-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onFocus={() => ketQua.length && setMo(true)}
          onKeyDown={phim}
          placeholder="Tìm học viên, lớp, giáo viên…"
          aria-label="Tìm kiếm toàn hệ thống"
          className="w-full rounded-lg bg-navy-700/50 py-2 pr-8 pl-8 text-[0.8125rem] text-white placeholder:text-navy-400 focus:bg-navy-700 focus:ring-1 focus:ring-gold-400/60 focus:outline-none"
        />
        {dangChay ? (
          <Loader2
            className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-navy-400"
            strokeWidth={1.75}
          />
        ) : null}
      </div>

      {mo && (ketQua.length > 0 || khongThay) ? (
        <div className="absolute inset-x-3 z-40 mt-1 overflow-hidden rounded-lg border border-navy-600 bg-navy-800 shadow-xl">
          {khongThay ? (
            <p className="px-3 py-2.5 text-[0.75rem] text-navy-300">
              Không có kết quả cho “{tuKhoa.trim()}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {ketQua.map((k, i) => (
                <li key={`${k.loai}-${k.id}`}>
                  <button
                    type="button"
                    onClick={() => diToi(k)}
                    onMouseEnter={() => setChon(i)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem]",
                      i === chon ? "bg-navy-700 text-white" : "text-navy-100",
                    )}
                  >
                    <span className="truncate">{k.ten}</span>
                    <span className="ml-auto shrink-0 text-[0.625rem] tracking-wide text-gold-400 uppercase">
                      {NHAN[k.loai]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
