import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@mui/material/styles'
import { FormControl, Button, Box, Typography, IconButton } from '@mui/material'
import { IconUpload, IconX } from '@tabler/icons-react'
import { useDispatch } from 'react-redux'
import { getFileName } from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import { FLOWISE_IMAGE_UPLOAD_MIME_TYPES, FLOWISE_MAX_IMAGE_UPLOAD_MB } from '@/config/uploadLimits'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

function acceptSpecifiesOnlyImages(accept) {
    if (!accept || accept === '*') return false
    const parts = accept.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return false
    return parts.every((p) => {
        if (p === 'image/*') return true
        if (p.startsWith('image/')) return true
        if (p.startsWith('.')) {
            return IMAGE_EXTENSIONS.includes(p.toLowerCase())
        }
        return false
    })
}

function fileMatchesAccept(file, accept) {
    if (!accept || accept === '*') return true
    const parts = accept.split(',').map((s) => s.trim()).filter(Boolean)
    for (const p of parts) {
        if (p === 'image/*' && file.type.startsWith('image/')) return true
        if (p.startsWith('.') && file.name.toLowerCase().endsWith(p.toLowerCase())) return true
        if (p.includes('/') && file.type === p) return true
    }
    return false
}

export const File = ({ value, formDataUpload, fileType, onChange, onFormDataChange, disabled = false }) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))

    const [myValue, setMyValue] = useState(value ?? '')
    const [fileInputKey, setFileInputKey] = useState(0)
    const inputRef = useRef(null)

    const imageRulesApply = acceptSpecifiesOnlyImages(fileType)

    const showImageHint = imageRulesApply
    const imageHint = `Imágenes: máximo ${FLOWISE_MAX_IMAGE_UPLOAD_MB} MB. Formatos: GIF, JPEG, PNG, WEBP.`

    const rejectFile = (message) => {
        enqueueSnackbar({
            message,
            options: {
                variant: 'error',
                key: new Date().getTime() + Math.random()
            }
        })
        if (inputRef.current) {
            inputRef.current.value = ''
        }
        setFileInputKey((k) => k + 1)
    }

    const validateImageRules = (file) => {
        const sizeMb = file.size / 1024 / 1024
        if (sizeMb > FLOWISE_MAX_IMAGE_UPLOAD_MB) {
            rejectFile(`El archivo supera el máximo de ${FLOWISE_MAX_IMAGE_UPLOAD_MB} MB.`)
            return false
        }
        const looksImage =
            (file.type && file.type.startsWith('image/')) ||
            (!file.type && IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)))
        if (!looksImage || !fileMatchesAccept(file, fileType)) {
            rejectFile('Formato no válido. Use GIF, JPEG, PNG o WEBP.')
            return false
        }
        if (file.type && !FLOWISE_IMAGE_UPLOAD_MIME_TYPES.includes(file.type)) {
            rejectFile('Formato no válido. Use GIF, JPEG, PNG o WEBP.')
            return false
        }
        return true
    }

    const handleFileUpload = async (e) => {
        if (!e.target.files) return

        if (e.target.files.length === 1) {
            const file = e.target.files[0]
            if (imageRulesApply && !validateImageRules(file)) {
                return
            }
            const { name } = file

            const reader = new FileReader()
            reader.onload = (evt) => {
                if (!evt?.target?.result) {
                    return
                }
                const { result } = evt.target

                const value = result + `,filename:${name}`

                setMyValue(value)
                onChange(value)
            }
            reader.readAsDataURL(file)
        } else if (e.target.files.length > 0) {
            const fileArr = Array.from(e.target.files)
            if (imageRulesApply) {
                for (const file of fileArr) {
                    if (!validateImageRules(file)) {
                        return
                    }
                }
            }
            let files = fileArr.map((file) => {
                const reader = new FileReader()
                const { name } = file

                return new Promise((resolve) => {
                    reader.onload = (evt) => {
                        if (!evt?.target?.result) {
                            return
                        }
                        const { result } = evt.target
                        const value = result + `,filename:${name}`
                        resolve(value)
                    }
                    reader.readAsDataURL(file)
                })
            })

            const res = await Promise.all(files)
            setMyValue(JSON.stringify(res))
            onChange(JSON.stringify(res))
        }
    }

    const handleFormDataUpload = async (e) => {
        if (!e.target.files) return

        if (e.target.files.length === 1) {
            const file = e.target.files[0]
            if (imageRulesApply && !validateImageRules(file)) {
                return
            }
            const { name } = file
            const formData = new FormData()
            formData.append('files', file)
            setMyValue(`,filename:${name}`)
            onChange(`,filename:${name}`)
            onFormDataChange(formData)
        } else if (e.target.files.length > 0) {
            const fileArr = Array.from(e.target.files)
            if (imageRulesApply) {
                for (const file of fileArr) {
                    if (!validateImageRules(file)) {
                        return
                    }
                }
            }
            const formData = new FormData()
            const values = []
            for (let i = 0; i < fileArr.length; i++) {
                formData.append('files', fileArr[i])
                values.push(`,filename:${fileArr[i].name}`)
            }
            setMyValue(JSON.stringify(values))
            onChange(JSON.stringify(values))
            onFormDataChange(formData)
        }
    }

    const handleClear = () => {
        setMyValue('')
        onChange('')
        onFormDataChange?.(new FormData())
        setFileInputKey((k) => k + 1)
    }

    const hasValue =
        myValue &&
        myValue.length > 0 &&
        myValue !== 'Choose a file to upload'

    return (
        <FormControl sx={{ mt: 1, width: '100%' }} size='small'>
            {!formDataUpload && (
                <span
                    style={{
                        fontStyle: 'italic',
                        color: theme.palette.grey['800'],
                        marginBottom: '1rem'
                    }}
                >
                    {myValue ? getFileName(myValue) : 'Choose a file to upload'}
                </span>
            )}
            {showImageHint && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                    {imageHint}
                </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    disabled={disabled}
                    variant='outlined'
                    component='label'
                    fullWidth
                    startIcon={<IconUpload />}
                    sx={{ marginRight: '1rem', flex: '1 1 auto' }}
                >
                    {'Upload File'}
                    <input
                        key={fileInputKey}
                        ref={inputRef}
                        type='file'
                        multiple
                        accept={fileType}
                        hidden
                        onChange={(e) => (formDataUpload ? handleFormDataUpload(e) : handleFileUpload(e))}
                    />
                </Button>
                {hasValue && (
                    <IconButton
                        type='button'
                        color='error'
                        disabled={disabled}
                        onClick={handleClear}
                        title='Quitar archivo'
                        aria-label='Quitar archivo'
                        size='small'
                    >
                        <IconX size={20} />
                    </IconButton>
                )}
            </Box>
        </FormControl>
    )
}

File.propTypes = {
    value: PropTypes.string,
    fileType: PropTypes.string,
    formDataUpload: PropTypes.bool,
    onChange: PropTypes.func,
    onFormDataChange: PropTypes.func,
    disabled: PropTypes.bool
}
