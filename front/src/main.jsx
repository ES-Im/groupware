import '@/assets/scss/app.scss';
import 'flatpickr/dist/flatpickr.min.css';
import {StrictMode} from 'react';
import 'react-datepicker/dist/react-datepicker.min.css';
import 'react-day-picker/style.css';
import {createRoot} from 'react-dom/client';
import 'react-quill-new/dist/quill.bubble.css';
import 'react-quill-new/dist/quill.core.css';
import 'react-quill-new/dist/quill.snow.css';
import {BrowserRouter} from "react-router";
import 'simplebar-react/dist/simplebar.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import App from './App';
import AppWrapper from "./components/AppWrapper";

createRoot(document.getElementById('root')).render(<StrictMode>
        <BrowserRouter>
            <AppWrapper>
                <App />
            </AppWrapper>
        </BrowserRouter>
    </StrictMode>);