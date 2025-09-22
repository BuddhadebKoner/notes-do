import React, { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
   Download,
   Eye,
   Heart,
   FileText,
   User2
} from 'lucide-react'
import { Link } from 'react-router-dom'

const NoteCard = ({ note, onView, onDownload }) => {
   const {
      _id,
      title,
      subject,
      viewUrl,
      downloadUrl,
      driveFileId,
      thumbnailUrl,
      stats = {},
      uploader = {}
   } = note

   const [isLiked, setIsLiked] = useState(false)

   // Get PDF preview URL - prioritize stored thumbnailUrl, fallback to constructed URL
   const getPreviewUrl = () => {
      // First try the stored thumbnail URL from backend
      if (thumbnailUrl) {
         return thumbnailUrl
      }

      // Fallback to constructed Google Drive thumbnail URL
      if (driveFileId && !driveFileId.startsWith('local_')) {
         return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w300-h400`
      }

      return null
   }

   const noteDetailsPage = `/note/${_id}`
   const profilePage = `/user/${uploader.username || 'unknown'}`

   const handleDownload = () => {
      if (downloadUrl) {
         window.open(downloadUrl, '_blank')
      } else if (onDownload) {
         onDownload(_id)
      }
   }

   const handleLike = (e) => {
      e.stopPropagation()
      setIsLiked(!isLiked)
   }

   return (
      <Card className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 bg-white">
         {/* PDF Preview */}
         <Link
            to={noteDetailsPage}
            className="relative aspect-[4/3] bg-gray-50 rounded-t-lg overflow-hidden cursor-pointer">
            {getPreviewUrl() ? (
               <>
                  <img
                     src={getPreviewUrl()}
                     alt={title}
                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                     }}
                  />
                  {/* Fallback shown on error */}
                  <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-50">
                     <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">Preview not available</p>
                     </div>
                  </div>
               </>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                     <FileText className="w-16 h-16 mx-auto mb-2" />
                     <p className="text-sm">PDF Document</p>
                  </div>
               </div>
            )}
         </Link>

         {/* Content */}
         <CardContent className="p-4 flex-1">
            {/* Title */}
            <Link
               to={noteDetailsPage}
               className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900 cursor-pointer hover:text-blue-600 transition-colors mb-2"
            >
               {title}
            </Link>

            {/* Subject */}
            <p className="text-sm text-gray-600 mb-3">{subject}</p>

            {/* Stats and Actions */}
            <div className="flex items-center justify-between">
               {/* Stats */}
               <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                     <Eye className="w-4 h-4" />
                     <span>{stats.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Heart className="w-4 h-4" />
                     <span>{stats.likes || 0}</span>
                  </div>
               </div>

               {/* Download button */}
               <Button
                  onClick={handleDownload}
                  size="sm"
                  className="flex items-center gap-2"
               >
                  <Download className="w-4 h-4" />
                  Download
               </Button>
            </div>

            {/* Posted by */}
            <Link to={profilePage}
               className="flex items-center gap-2 mt-3 pt-3 border-t">
               <Avatar className="w-6 h-6">
                  <AvatarImage src={uploader.avatar} alt={uploader.name} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                     {uploader.name ?
                        uploader.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() :
                        <User2 className="w-3 h-3" />
                     }
                  </AvatarFallback>
               </Avatar>
               <span className="text-sm text-gray-600">
                  <span className="font-medium">{uploader.name || 'Anonymous'}</span>
               </span>
            </Link>
         </CardContent>
      </Card>
   )
}

export default NoteCard