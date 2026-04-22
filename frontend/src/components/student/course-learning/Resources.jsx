import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { FaRegFolderOpen } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { TbFileTypePdf, TbFileTypeDoc, TbFileTypePng } from "react-icons/tb";
import { LuFile } from "react-icons/lu";
import axios from 'axios';
import { BASE_URL } from '@/redux/constants';

const getFileIcon = (type) => {
    switch (type) {
        case 'pdf':
            return <TbFileTypePdf className="w-5 h-5 shrink-0" />;
        case 'doc':
        case 'docx':
            return <TbFileTypeDoc className="w-5 h-5 shrink-0" />;
        case 'image':
        case 'png':
        case 'jpg':
            return <TbFileTypePng className="w-5 h-5 shrink-0" />;
        default:
            return <LuFile className="w-5 h-5 shrink-0" />;
    }
};

function getFileTypeFromName(filename) {
    if (!filename || typeof filename !== 'string') return 'unknown';

    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
}


const Resources = ({ resources }) => {
    // console.log(resources)

    const handleDownload = async (s3Key, fileName) => {
        try {
            const res = await axios.get(`${BASE_URL}/api/downloadResources`, {
                params: { key: s3Key }
            });

            const { downloadURL } = res.data;
            const response = await fetch(downloadURL);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            link.click();

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download error:", error);
        }
    };
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <p className='py-0.5 px-2 border border-blue-600 hover:bg-blue-100 rounded-sm text-sm flex items-center gap-1 text-blue-600'>
                        <FaRegFolderOpen className='text-sm text-blue-600' /> Tài nguyên <IoIosArrowDown className='text-blue-600' />
                    </p>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="" side="bottom" align="start">
                    {resources?.map((item, id) => (
                        <DropdownMenuItem key={id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleDownload(item.s3Key, item.fileName)}
                                        key={id}
                                        className='flex items-center gap-1 cursor-pointer'
                                    >
                                        {getFileIcon(getFileTypeFromName(item.fileName))}
                                        <span className="text-xs font-medium text-gray-800 truncate">
                                            {item.fileName}
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="center">
                                    <p>Nhấn để tải xuống</p>
                                </TooltipContent>
                            </Tooltip>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default Resources