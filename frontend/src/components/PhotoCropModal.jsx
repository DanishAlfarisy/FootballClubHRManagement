import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X } from 'lucide-react'
import { cropImage } from '../lib/cropImage'

export default function PhotoCropModal({ source, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixels, setPixels] = useState(null)
  return <div className="modal-backdrop crop-layer"><div className="modal crop-modal"><header><h2>Crop profile photo</h2><button type="button" onClick={onCancel} title="Close"><X /></button></header><div className="crop-stage"><Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_area, areaPixels) => setPixels(areaPixels)} /></div><label className="zoom-control"><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><footer><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="primary" onClick={async () => onConfirm(await cropImage(source, pixels))}><Check />Use photo</button></footer></div></div>
}