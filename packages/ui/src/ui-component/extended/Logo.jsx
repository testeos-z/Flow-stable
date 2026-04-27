import logoDark from '@/assets/images/logotipo.svg'
import logo from '@/assets/images/logotipoDark.svg'

import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', marginLeft: '10px' }}>
            <img
                style={{ objectFit: 'contain', height: 'auto', width: 170 }}
                src={customization.isDarkMode ? logoDark : logo}
                alt='GobernAI'
            />
        </div>
    )
}

export default Logo
