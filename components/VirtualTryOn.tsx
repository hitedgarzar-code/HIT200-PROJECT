const capturePhoto = async () => {
  if (!videoRef.current || !canvasRef.current) return
  const ctx = canvasRef.current.getContext('2d')!
  canvasRef.current.width  = videoRef.current.videoWidth
  canvasRef.current.height = videoRef.current.videoHeight
  ctx.drawImage(videoRef.current, 0, 0)
  const dataUrl      = canvasRef.current.toDataURL('image/jpeg', 0.9)
  const smallDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.3)
  setUserPhoto(dataUrl)
  setResultImage(null)
  setSuggestedSize(null)
  stopCamera()
  setIsAnalyzing(true)
  const size = await analyzeSizeFromPhoto(smallDataUrl, clothingType)
  setSuggestedSize(size)
  setIsAnalyzing(false)
}
