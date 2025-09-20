import React from "react";
import './NotFound.css';
import BackButton from '../../components/BackButton';

const NotFound =() => {

    return (
        <div>
            <div style={{ padding: '12px' }}>
                <BackButton label="Volver" />
            </div>
            <div className="img-not">
                    <p className="titulo"> Ups No encontrado Error 404 .</p>
            </div>

        </div>
     
    );
};

export default NotFound;