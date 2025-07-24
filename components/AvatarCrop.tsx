import Cropper, { Area } from 'react-easy-crop';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { RotateCw, Contrast, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

interface croppedAreaPixels {
    x: number;
    y: number;
    width: number;
    height: number;
}


// The getCroppedImg function remains the same as the one you provided
function getCroppedImg(file: File, croppedAreaPixels: croppedAreaPixels , rotation: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.crossOrigin = 'anonymous'; // Important for CORS
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }

            const rotRad = (rotation * Math.PI) / 180;
            const { width, height } = image;
            // calculate bounding box of rotated image
            const sin = Math.abs(Math.sin(rotRad));
            const cos = Math.abs(Math.cos(rotRad));
            const newWidth = width * cos + height * sin;
            const newHeight = width * sin + height * cos;

            canvas.width = newWidth;
            canvas.height = newHeight;

            // rotate canvas and draw image
            ctx.translate(newWidth / 2, newHeight / 2);
            ctx.rotate(rotRad);
            ctx.drawImage(image, -width / 2, -height / 2);

            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');

            if (!croppedCtx) {
                return reject(new Error('Failed to get cropped canvas context'));
            }

            croppedCanvas.width = croppedAreaPixels.width;
            croppedCanvas.height = croppedAreaPixels.height;

            // draw rotated image to cropped canvas
            croppedCtx.drawImage(
                canvas,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            croppedCanvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas is empty'));
                }
            }, file.type);
        };
        image.onerror = (error) => {
            reject(error);
        };
    });
}


const AvatarCropDialog = ({
    isOpen,
    setIsOpen,
    file,
    onConfirm,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    file?: File;
    onConfirm: (blob: Blob) => void;
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(1);
    const [contrast, setContrast] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<croppedAreaPixels>(null);
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        // Create an object URL when a file is passed in
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImageSrc(objectUrl);
            // Clean up the object URL on unmount
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]); // This effect runs whenever the file prop changes

    const onCropComplete = (_: Area, croppedPixels: croppedAreaPixels) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const handleConfirmCrop = async () => {
        if (!croppedAreaPixels || !file) {
             toast.error('Could not determine crop area.');
             return;
        }
        try {
            const blob = await getCroppedImg(file, croppedAreaPixels, rotation);
            setIsOpen(false);
            onConfirm(blob);
        } catch (e) {
            console.error(e);
            toast.error('Failed to crop image. Please try a different image.');
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title className="text-xl font-medium leading-6 text-gray-900 mb-4">Edit Photo</Dialog.Title>

                            <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                                {imageSrc && ( // Conditionally render Cropper only when image source is ready
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                        onCropComplete={onCropComplete}
                                        style={{ containerStyle: { filter: `brightness(${brightness}) contrast(${contrast})` } }}
                                    />
                                )}
                            </div>

                            <div className="mt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                     <div className="space-y-2">
                                        <label htmlFor="zoom" className="flex items-center text-sm font-medium text-gray-700"><span className="w-5 h-5 mr-2">🔎</span> Zoom</label>
                                        <input id="zoom" type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="rotation" className="flex items-center text-sm font-medium text-gray-700"><RotateCw className="w-5 h-5 mr-2" /> Rotation</label>
                                        <input id="rotation" type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="brightness" className="flex items-center text-sm font-medium text-gray-700"><Sun className="w-5 h-5 mr-2" /> Brightness</label>
                                        <input id="brightness" type="range" min={0.5} max={1.5} step={0.05} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="contrast" className="flex items-center text-sm font-medium text-gray-700"><Contrast className="w-5 h-5 mr-2" /> Contrast</label>
                                        <input id="contrast" type="range" min={0.5} max={1.5} step={0.05} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200" onClick={() => setIsOpen(false)}>Cancel</button>
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={handleConfirmCrop}>Crop & Upload</button>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AvatarCropDialog;