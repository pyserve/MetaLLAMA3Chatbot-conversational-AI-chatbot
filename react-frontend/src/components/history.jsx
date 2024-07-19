import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

const History = () => {
    const { theme } = useContext(AuthContext);

    return(
        <div className="card shadow-lg border-0">
            <div className={`card-header p-3 bg-${theme === "light" ? "white" : "dark"} 
                text-${theme === "light" ? "dark" : "white"} border-top`}>
                <div className="d-flex justify-content-between alig-items-center">
                    <div className=""><i className="fa fa-clock"></i> Chat History</div>
                    <div className="">
                        <i className="fa fa-edit"></i>
                    </div>
                </div>
            </div>
            <div className={`p-0 card-body bg-${theme === "light" ? "white" : "secondary"} 
                text-${theme === "light" ? "dark" : "white"} overflow-auto`} style={{
                minHeight: '81vh',
                maxHeight: '81hv'
            }}>
                <ul className="list-group p-0">
                    <li className="list-group-item rounded-0 p-3 mt-1 list-group-item-primary">
                        <div className="d-flex justify-content-between">
                            <div>Chat History 1: Starting AI and ML</div>
                            <div><i className="fa-solid fa-ellipsis"></i></div>
                        </div>
                    </li>
                    <li className="list-group-item rounded-0 p-3 mt-1 list-group-item-primary">
                        <div className="d-flex justify-content-between">
                            <div>Chat History 2: Build an AI Model</div>
                            <div><i className="fa-solid fa-ellipsis"></i></div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default History;