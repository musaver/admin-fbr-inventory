/**
 * FBR Status Check API
 * 
 * This endpoint provides detailed status information about FBR integration
 * including validation responses and invoice statuses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice, postInvoice, testFbrConnection, validateFbrConfig } from '@/lib/fbr/client';
import { createTestFbrInvoice } from '@/lib/fbr/mapper';
import type { ScenarioId } from '@/lib/fbr/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';
    
    if (action === 'status') {
      // Get comprehensive status
      const config = validateFbrConfig();
      const connection = await testFbrConnection();
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        configuration: config,
        connection,
        environment: {
          baseUrl: process.env.FBR_BASE_URL ? 'Set' : 'Missing',
          token: process.env.FBR_SANDBOX_TOKEN ? 'Set' : 'Missing',
          sellerNTN: process.env.FBR_SELLER_NTNCNIC ? 'Set' : 'Missing',
          sellerName: process.env.FBR_SELLER_BUSINESS_NAME ? 'Set' : 'Missing',
        },
      });
    }
    
    if (action === 'validate') {
      // Test validation with a sample invoice
      const scenarioId = (searchParams.get('scenario') || 'SN026') as ScenarioId;
      
      try {
        const testInvoice = await createTestFbrInvoice(scenarioId);
        const validation = await validateInvoice(testInvoice);
        
        return NextResponse.json({
          scenario: scenarioId,
          invoice: testInvoice,
          validation: {
            status: validation.validationResponse?.status,
            statusCode: validation.validationResponse?.statusCode,
            errorCode: validation.validationResponse?.errorCode,
            error: validation.validationResponse?.error,
            dated: validation.dated,
            fullResponse: validation,
          },
        });
      } catch (error) {
        return NextResponse.json({
          scenario: scenarioId,
          error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
      }
    }
    
    if (action === 'post') {
      // Test the complete flow (validate + post)
      const scenarioId = (searchParams.get('scenario') || 'SN026') as ScenarioId;
      
      try {
        const testInvoice = await createTestFbrInvoice(scenarioId);
        
        // Step 1: Validate
        console.log('🔍 Validating invoice...');
        const validation = await validateInvoice(testInvoice);
        
        const result: any = {
          scenario: scenarioId,
          invoice: testInvoice,
          validation: {
            status: validation.validationResponse?.status,
            statusCode: validation.validationResponse?.statusCode,
            errorCode: validation.validationResponse?.errorCode,
            error: validation.validationResponse?.error,
            dated: validation.dated,
            fullResponse: validation,
          },
        };
        
        // Step 2: Post (only if validation is successful)
        if (validation.validationResponse?.status === 'Valid') {
          console.log('✅ Validation successful, posting invoice...');
          const post = await postInvoice(testInvoice);
          
          result.post = {
            success: post.success,
            invoiceNumber: post.invoiceNumber,
            message: post.message,
            fullResponse: post,
          };
        } else {
          console.log('❌ Validation failed, skipping post');
        }
        
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json({
          scenario: scenarioId,
          error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      availableActions: {
        'status': 'Get comprehensive status',
        'validate': 'Test validation with scenario (specify ?scenario=SN026)',
        'post': 'Test complete flow (validate + post)',
      },
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ FBR status endpoint error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario = 'SN026', testData } = body;
    
    let testInvoice;
    
    if (testData) {
      // Use provided test data
      testInvoice = testData;
    } else {
      // Generate test invoice for scenario
      testInvoice = await createTestFbrInvoice(scenario as ScenarioId);
    }
    
    console.log('🧪 Testing with invoice:', {
      scenario: testInvoice.scenarioId,
      invoiceType: testInvoice.invoiceType,
      buyerType: testInvoice.buyerRegistrationType,
      itemCount: testInvoice.items?.length || 0,
    });
    
    // Step 1: Validate
    const validation = await validateInvoice(testInvoice);
    
    const result: any = {
      scenario,
      invoice: testInvoice,
      validation: {
        status: validation.validationResponse?.status,
        statusCode: validation.validationResponse?.statusCode,
        errorCode: validation.validationResponse?.errorCode,
        error: validation.validationResponse?.error,
        dated: validation.dated,
        fullResponse: validation,
      },
    };
    
    // Step 2: Post (only if validation is successful)
    if (validation.validationResponse?.status === 'Valid') {
      console.log('✅ Validation successful, posting invoice...');
      
      try {
        const post = await postInvoice(testInvoice);
        
        result.post = {
          status: 'Success',
          invoiceNo: post.invoiceNumber,
          success: post.success,
          message: post.message,
          fullResponse: post,
        };
      } catch (postError) {
        result.post = {
          status: 'Failed',
          error: postError instanceof Error ? postError.message : String(postError),
        };
      }
    } else {
      console.log('❌ Validation failed, skipping post');
      result.post = {
        status: 'Skipped',
        reason: 'Validation failed',
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ FBR status POST error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
