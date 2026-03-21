import Loader from '@/components/Loader';
import {useLayoutContext} from '@/context/useLayoutContext';
import {Fragment, useEffect, useState} from 'react';
import {Outlet} from "react-router";
import Sidenav from "@/layouts/components/sidenav/index.jsx";
import Topbar from "@/layouts/components/topbar/index.jsx";
import Footer from "@/layouts/components/footer/index.jsx";
// import Customizer from "@/layouts/components/customizer/index.jsx";

const MainLayout = ({
        children
}) => {
    const {
        orientation
    } = useLayoutContext();

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return <Loader height="100vh" />;

    return <Fragment>
        <div className="wrapper">
            <Sidenav />
            <Topbar />

            <div className="content-page">
                {children}
                <Outlet />
                <Footer />
            </div>
        </div>

    </Fragment>;
};

export default MainLayout;



