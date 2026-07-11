import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Public verification endpoint
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Retrieve the certificate data
    const { data: test, error } = await supabaseAdmin
      .from('drug_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !test) {
      return res.status(404).json({ verified: false, error: 'Document not found or invalid barcode' });
    }

    // 2. Extract client details for logging
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // 3. Log the verification scan event asynchronously
    const { error: logErr } = await supabaseAdmin
      .from('verification_logs')
      .insert({
        document_id: id,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (logErr) {
      logger.warn(`Failed to insert verification log: ${logErr.message}`);
    } else {
      logger.info(`Verification log recorded for document ${id} from IP ${ipAddress}`);
    }

    // 4. Return the verified document metadata
    res.json({
      verified: true,
      scanned_at: new Date().toISOString(),
      test,
    });
  } catch (err: any) {
    logger.error(`Error in public verify route: ${err.message}`);
    res.status(500).json({ verified: false, error: 'Internal Server Error' });
  }
});

export default router;
