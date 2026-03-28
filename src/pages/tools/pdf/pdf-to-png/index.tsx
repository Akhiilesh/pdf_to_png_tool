import { useState } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import ToolContent from '@components/ToolContent';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { ToolComponentProps } from '@tools/defineTool';
import { convertPdfToPngImages } from './service';
import ToolMultiFileResult from '@components/result/ToolMultiFileResult';
import { Icon } from '@iconify/react';

type ImagePreview = {
  blob: Blob;
  url: string;
  filename: string;
};

export default function PdfToPng({ title }: ToolComponentProps) {
  const [input, setInput] = useState<File | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [zipBlob, setZipBlob] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!input) return;
    setLoading(true);
    setImages([]);
    setZipBlob(null);
    try {
      const { images, zipFile } = await convertPdfToPngImages(input);
      setImages(images);
      setZipBlob(zipFile);
    } catch (err) {
      console.error('Conversion failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      initialValues={{}}
      compute={() => {}} // Dummy compute to avoid auto-triggering
      inputComponent={
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          <ToolPdfInput
            value={input}
            onChange={(file) => {
              setInput(file);
              setImages([]);
              setZipBlob(null);
            }}
            accept={['application/pdf']}
            title="Upload your PDF"
          />
          {input && (
            <Button
              variant="contained"
              size="large"
              onClick={handleConvert}
              disabled={loading}
              startIcon={
                !loading && (
                  <Icon icon="solar:convert-to-png-bold-duotone" width={24} />
                )
              }
              sx={{
                py: 1.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: '50px',
                boxShadow: '0 4px 14px 0 rgba(255, 140, 0, 0.39)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(255, 140, 0, 0.23)'
                }
              }}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="button">Converting...</Typography>
                </Box>
              ) : (
                'Convert to PNG'
              )}
            </Button>
          )}
        </Box>
      }
      resultComponent={
        <ToolMultiFileResult
          title="Conversion Results"
          value={images.map((img) => {
            return new File([img.blob], img.filename, { type: 'image/png' });
          })}
          zipFile={zipBlob}
          loading={loading}
          loadingText="Processing your PDF..."
        />
      }
      getGroups={null}
      toolInfo={{
        title: 'High-Quality PDF to PNG conversion',
        description:
          'Our Cognex tool transforms every page of your PDF into a vibrant, high-quality PNG image. Perfect for presentations, social media, or archival purposes.'
      }}
    />
  );
}
