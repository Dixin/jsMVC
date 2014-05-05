cmd /c "cd ..\build & make"
start cmd /c "node.exe --debug-brk node.server.js"
start cmd /c "node-inspector"
start chrome --new-window 127.0.0.1:8080/debug?port=5858