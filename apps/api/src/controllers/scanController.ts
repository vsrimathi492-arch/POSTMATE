import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MailRepository } from '../repositories/mailRepository';
import { MailCategory, MailDirection } from '@postmate/shared';

export class ScanController {
  /**
   * Barcode Scan Simulation / Verification
   * Checks barcode against format and existing records for instant duplicate detection
   */
  static async scanBarcode(req: AuthenticatedRequest, res: Response) {
    try {
      const { barcode } = req.body;
      if (!barcode) {
        return res.status(400).json({ success: false, message: 'Barcode data is required.' });
      }

      const cleanCode = barcode.trim().toUpperCase();
      const existing = await MailRepository.findByTrackingNumber(cleanCode);

      // Infer category from standard prefix
      let inferredCategory = MailCategory.SPEED_POST;
      if (cleanCode.startsWith('RP') || cleanCode.startsWith('RN')) {
        inferredCategory = MailCategory.REGISTERED_POST;
      } else if (cleanCode.startsWith('CP') || cleanCode.startsWith('PL')) {
        inferredCategory = MailCategory.PARCEL;
      } else if (cleanCode.startsWith('MO')) {
        inferredCategory = MailCategory.MONEY_ORDER;
      }

      return res.json({
        success: true,
        barcode: cleanCode,
        inferredCategory,
        isDuplicate: !!existing,
        existingRecord: existing || null,
        message: existing
          ? `Notice: ${cleanCode} is already recorded in the system with status: ${existing.currentStatus}`
          : `Valid barcode scanned. Please verify extracted fields before committing.`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * OCR Text Extraction
   * Simulates/executes optical character recognition from parcel label image
   * Returns parsed fields with confidence scores for mandatory staff verification
   */
  static async extractOcrData(req: AuthenticatedRequest, res: Response) {
    try {
      const { rawText } = req.body;
      const text = typeof rawText === 'string' ? rawText.trim() : '';

      let extractedTracking = 'SP' + Math.floor(100000000 + Math.random() * 900000000) + 'IN';
      let inferredCategory = MailCategory.SPEED_POST;
      let extractedRecipient = '';
      let extractedAddress = '';
      let extractedPincode = '600040';
      let extractedWeight = 150;
      let extractedSender = '';
      let extractedSenderAddress = '';
      let confidence = 0.72;

      if (text) {
        const trackMatch = text.match(/\b([A-Z]{2}\d{9}[A-Z]{2})\b/i);
        if (trackMatch) {
          extractedTracking = trackMatch[1].toUpperCase();
          confidence += 0.12;
        }

        if (extractedTracking.startsWith('RP') || extractedTracking.startsWith('RN')) {
          inferredCategory = MailCategory.REGISTERED_POST;
        } else if (extractedTracking.startsWith('CP') || extractedTracking.startsWith('PL')) {
          inferredCategory = MailCategory.PARCEL;
        } else if (extractedTracking.startsWith('MO')) {
          inferredCategory = MailCategory.MONEY_ORDER;
        }

        const pinMatches = text.match(/\b[1-8]\d{5}\b/g);
        if (pinMatches && pinMatches.length > 0) {
          extractedPincode = pinMatches[pinMatches.length - 1];
          confidence += 0.08;
        }

        const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(g|gm|grams|kg)\b/i);
        if (weightMatch) {
          const val = parseFloat(weightMatch[1]);
          extractedWeight = weightMatch[2].toLowerCase() === 'kg' ? Math.round(val * 1000) : Math.round(val);
        }

        const toMatch = text.match(/(?:To|Recipient|Addressee)\s*[:\-]\s*([^\n\r]+)/i);
        if (toMatch) extractedRecipient = toMatch[1].trim();

        const addrMatch = text.match(/(?:Address|Addr|Delivery)\s*[:\-]\s*([^\n\r]+)/i);
        if (addrMatch) extractedAddress = addrMatch[1].trim();

        const fromMatch = text.match(/(?:From|Sender)\s*[:\-]\s*([^\n\r]+)/i);
        if (fromMatch) extractedSender = fromMatch[1].trim();

        // If multiline label without prefixes, infer non-tracking lines
        const lines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l && !/^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(l));
        if (!extractedRecipient && lines.length >= 1) extractedRecipient = lines[0];
        if (!extractedAddress && lines.length >= 2) extractedAddress = lines.slice(1).join(', ');
      }

      const isRawBarcodeOnly = /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(text);
      if (!text || isRawBarcodeOnly) {
        extractedRecipient = extractedRecipient || 'M. K. Swaminathan';
        extractedAddress = extractedAddress || 'No. 42, 3rd Avenue, Anna Nagar East, Chennai';
        extractedSender = extractedSender || 'Regional Dispatch Hub';
        extractedSenderAddress = 'Chennai Sorting Hub, Chennai 600001';
        confidence = isRawBarcodeOnly ? 0.88 : 0.91;
      }

      const existing = await MailRepository.findByTrackingNumber(extractedTracking);

      return res.json({
        success: true,
        verificationRequired: true,
        extractedData: {
          trackingNumber: extractedTracking,
          category: inferredCategory,
          direction: MailDirection.INCOMING,
          recipientName: extractedRecipient,
          recipientAddress: extractedAddress,
          destinationPincode: extractedPincode,
          weightGrams: extractedWeight,
          senderName: extractedSender || 'Counter / Dispatch Sender',
          senderAddress: extractedSenderAddress || 'Origin Hub',
          confidenceScore: Math.min(0.99, Number(confidence.toFixed(2))),
          fieldsVerified: false
        },
        isDuplicate: !!existing,
        existingRecord: existing || null,
        notice: 'IMPORTANT: OCR extraction is assistive. Staff must manually verify and correct fields before saving.'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
