import { useState, useEffect } from "react";
import "./BusinessOwnerApp.scss";
import axios from "axios";
import Home from "./Pages/Home/Home";
import Landing from "./Pages/Landing/Landing";
import NavBar from "./Components/NavBar/NavBar";

function BusinessOwnerApp() {
    const [authenticated, setAuthenticated] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [showWaitlist, setShowWaitlist] = useState(true);
    const [showServing, setShowServing] = useState(true);
    const [showCompleted, setShowCompleted] = useState(true);
    const [showInvalid, setShowInvalid] = useState(false);
    const [showSetting, setShowSetting] = useState(false);
    const [showCustomerDirectory, setShowCustomerDirectory] = useState(false);

    useEffect(() => {
        const checkViewportWidth = () => {
            if (window.innerWidth <= 1190) {
                setShowWaitlist(true);
                setShowServing(false);
                setShowCompleted(false);
                setShowInvalid(false);
                setShowSetting(false);
                setShowCustomerDirectory(false);
            } else {
                setShowWaitlist(true);
                setShowServing(true);
                setShowCompleted(true);
                setShowInvalid(false);
                setShowSetting(false);
                setShowCustomerDirectory(false);
            }
        };

        checkViewportWidth();

        // Optionally, you can add an event listener to update the state on window resize
        window.addEventListener("resize", checkViewportWidth);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener("resize", checkViewportWidth);
    }, [authenticated]);

    useEffect(() => {
        const checkUserAuthentication = async () => {
            try {
                const res = await axios.get("/auth/getUser");
                setCompanyName(res.data.name);
                setAuthenticated(true);
            } catch (err) {
                if (err.response.status === 401) {
                    console.log("Unauthorized");
                } else {
                    console.error("Error checking user authentication:", err);
                }
            }
        };
        checkUserAuthentication();
    }, [authenticated]);

    if (authenticated) {
        return (
            <div className="BusinessOwnerApp">
                <div className="nav-bar-container">
                    <NavBar
                        setAuthenticated={setAuthenticated}
                        setShowWaitlist={setShowWaitlist}
                        setShowServing={setShowServing}
                        setShowCompleted={setShowCompleted}
                        setShowInvalid={setShowInvalid}
                        setShowSetting={setShowSetting}
                        setShowCustomerDirectory={setShowCustomerDirectory}
                    />
                </div>
                <Home
                    companyName={companyName}
                    setAuthenticated={setAuthenticated}
                    showWaitlist={showWaitlist}
                    showServing={showServing}
                    showCompleted={showCompleted}
                    showInvalid={showInvalid}
                    showSetting={showSetting}
                    showCustomerDirectory={showCustomerDirectory}
                />
            </div>
        );
    } else {
        return (
            <div className="BusinessOwnerApp">
                <Landing setAuthenticated={setAuthenticated} />
            </div>
        );
    }
}

export default BusinessOwnerApp;
