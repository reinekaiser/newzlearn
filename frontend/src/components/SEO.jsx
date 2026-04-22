import React from 'react'
import { useLocation } from 'react-router-dom';

const SEO = ({
    title,
    description,
    keywords,
    image = "",
    type = 'website'
}) => {
    const SITE_NAME = "Newzlearn";
    const DOMAIN = import.meta.env.VITE_APP_DOMAIN || "https://newzlearn.id.vn";

    const location = useLocation();
    const currentUrl = `${DOMAIN}${location.pathname}`;
    const img = image || "https://res.cloudinary.com/dultbjb6x/image/upload/v1768406293/og-image_cfw7df.png"
    
    return (
        <>
            <title>{title}</title>
            <meta name="title" content={title}></meta>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords || "newzlearn, newzlearn Việt Nam, học online, học trực tuyến việt nam, khoá học sinh viên, khoá học giá rẻ, khoá học giá sinh viên, mua khoá học"} />
            <link rel="canonical" href={currentUrl} />

            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={img} />
            <meta property="og:image:alt" content={title} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:locale" content="vi_VN" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={img} />

            

        </>
    )
}

export default SEO