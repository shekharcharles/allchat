const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function killNodeProcesses() {
    return new Promise((resolve) => {
        exec('taskkill /F /IM node.exe', () => {
            setTimeout(resolve, 1000);
        });
    });
}

async function cleanBuild() {
    try {
        await killNodeProcesses();
        
        if (fs.existsSync('.next')) {
            // Wait for processes to fully terminate
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const rimrafSync = (dir) => {
                if (fs.existsSync(dir)) {
                    fs.readdirSync(dir).forEach((file) => {
                        const curPath = path.join(dir, file);
                        if (fs.lstatSync(curPath).isDirectory()) {
                            rimrafSync(curPath);
                        } else {
                            try {
                                fs.unlinkSync(curPath);
                            } catch (e) {
                                console.log(`Could not delete ${curPath}: ${e.message}`);
                            }
                        }
                    });
                    try {
                        fs.rmdirSync(dir);
                    } catch (e) {
                        console.log(`Could not remove directory ${dir}: ${e.message}`);
                    }
                }
            };
            
            rimrafSync('.next');
            console.log('Cleaned .next directory');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

async function handleError(error) {
    if (error.includes('EBUSY') || error.includes('resource busy or locked')) {
        console.log('Detected file lock issue, cleaning build...');
        await cleanBuild();
        startDev();
    } else if (error.includes('EADDRINUSE')) {
        console.log('Port 3000 is in use, attempting to free it...');
        const platform = process.platform;
        if (platform === 'win32') {
            exec('netstat -ano | findstr :3000', async (err, stdout) => {
                if (!err && stdout) {
                    const pid = stdout.match(/\s+(\d+)\s*$/m)?.[1];
                    if (pid) {
                        exec(`taskkill /F /PID ${pid}`, async () => {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            startDev();
                        });
                    }
                }
            });
        }
    }
}

function startDev() {
    console.log('Starting Next.js development server...');
    const dev = spawn('npm', ['run', 'dev'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    dev.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('error')) {
            handleError(output);
        }
    });

    dev.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(error);
        handleError(error);
    });

    dev.on('close', (code) => {
        if (code !== 0) {
            console.log(`Process exited with code ${code}`);
            setTimeout(startDev, 1000);
        }
    });
}

// Start monitoring
(async () => {
    await cleanBuild();
    startDev();
})(); 