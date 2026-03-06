import Input from './Input'
import { getStates } from '../api/configs'
import { useEffect, useState } from 'react'

function SelectState({ value, onChange }) {
    const [states, setStates] = useState([])

    useEffect(() => {
        getStates().then((res) => {
            setStates(res.data)
        })
    }, [])
    return (
        <Input
            value={value}
            onChange={onChange}
            placeholder="Select State"
            label="State"
            className='modal-input'
            labelClassName='modal-label'
            select
            options={states.map((state) => ({ value: state.id, label: `${state.name} (${state.country})` }))}
        />
    )
}

export default SelectState