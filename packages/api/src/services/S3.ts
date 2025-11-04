import { S3 } from 'aws-sdk';


const client = new S3();
const S3_BUCKET = process.env.S3_BUCKET as string;

export module S3Client {
    export async function checkIfArtifactExists(artifactId: string): Promise<boolean> {
        console.log(process.env.S3_BUCKET);
        console.log(S3_BUCKET);
        try {
            await client.headObject({
                Bucket: S3_BUCKET,
                Key: `packages/${artifactId}.zip`
            }).promise();
            return true;
        } catch(err) {
            // if(err instanceof AWSError) {
            //     console.error(err.code, err.message, err.stack);
            //     return false;
            // }
            console.error("S3 Error", err);
            return false;
        }
    }
}