'use client'

interface Props {
  productName: string
  productImage: string
  productCategory?: string
}

export default function VirtualTryOn({ productName, productImage, productCategory }: Props) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-gray-500">Virtual Try-On: {productName}</p>
    </div>
  )
}
