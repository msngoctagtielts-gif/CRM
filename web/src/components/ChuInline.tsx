import { Fragment } from 'react'

/**
 * Hiển thị **đậm** và *nghiêng* trong chuỗi văn bản.
 *
 * Cố ý chỉ làm hai thứ đó. Dựng cả bộ Markdown ở đây là mời gọi chèn HTML vào
 * nội dung, mà nội dung thì nằm trong mã nguồn nên chẳng cần tới.
 */
export function ChuInline({ chu }: { chu: string }) {
  const phan = chu.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {phan.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
          return <strong key={i}>{p.slice(2, -2)}</strong>
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
          return <em key={i}>{p.slice(1, -1)}</em>
        }
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
