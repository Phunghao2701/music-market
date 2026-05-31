import swaggerSpec from '../src/config/swagger.js';
import logger from '../src/utils/logger.js';

try {
  logger.info('===============================================');
  logger.info('Verifying Swagger Spec Generation...');
  logger.info('===============================================');

  if (swaggerSpec && swaggerSpec.openapi === '3.0.0') {
    logger.info('Swagger spec generated successfully!');
    logger.info(`OpenAPI Version: ${swaggerSpec.openapi}`);
    logger.info(`Title: ${swaggerSpec.info.title}`);
    logger.info(`Version: ${swaggerSpec.info.version}`);
    logger.info(`Number of Paths: ${Object.keys(swaggerSpec.paths || {}).length}`);
    
    // Log out path names to ensure everything is scanned
    logger.info('Registered Paths:');
    Object.keys(swaggerSpec.paths || {}).forEach(p => {
      logger.info(` - ${p}`);
    });
    
    logger.info('Swagger JSDoc Verification Passed.');
  } else {
    logger.error('Failed: Invalid Swagger spec structure.');
    process.exit(1);
  }
} catch (error) {
  logger.error('Error verifying swagger spec:', error);
  process.exit(1);
}
process.exit(0);
