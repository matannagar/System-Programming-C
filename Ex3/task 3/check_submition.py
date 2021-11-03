import glob, os , sys
import shutil
import subprocess
import re

def pars_input():
    submission_file = sys.argv[1]
    print(submission_file)
    f= open(submission_file,"r")
    for line in f.readlines():
        if re.search(r'\.git', line):
            git_rep = line
            continue
        if re.search(r'\b\d{9}[\s_\Z]', line):
            ids = line
            print(line)
            continue
        if re.search(r'.+', line):
            commit = line
            continue
    return git_rep , ids , commit

def main():
    git_rep , ids,  commit = pars_input()
    print ("your git repository is: " + git_rep)
    print ("your ids are: " + ids)
    print ("your commit is: " + commit)


    try:
        print("cloning your git: " + git_rep)
        proc = subprocess.Popen("git clone " + git_rep, shell=True, stdout=subprocess.PIPE , stderr=subprocess.PIPE)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("clone failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't clone your git.")
        print(inst)
        exit(1)


    try:
        match = re.search(r'([\w-]+)\.git', git_rep)
        dir = match.group(1)
        print("changing folder to: " + dir)
        os.chdir(dir)
    except Exception as inst:
        print("go into you git dir failed")
        print(inst)
        exit(1)

    try:
        print("checking out you commit: " + commit[:5])
        print(os.getcwd())
        proc = subprocess.Popen("git checkout " + commit[:5], shell=True, stdout=subprocess.PIPE , stderr=subprocess.PIPE)
        proc.wait()
        if proc.returncode != 0:
           for line in iter(proc.stdout.readline,''):
                print (line)
           for line in iter(proc.stderr.readline,''):
                print (line)
           raise Exception("checkout$$ failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't cherckout your commit.")
        print(inst)
        exit(1)

    try:
        print("compiling with make all")
        proc = subprocess.Popen("make all", shell=True, stdout=subprocess.PIPE , stderr=subprocess.PIPE)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("compilation failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't compile.")
        print(inst)
        exit(1)

    try:
        print("running: ./isort < ../sort_input.txt" )
        proc = subprocess.Popen("./isort < ../sort_input.txt", shell=True)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("isort failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't run isort.")
        print(inst)
        exit(1)

    try:
        print("running: ./txtfind < ../find_input.txt" )
        proc = subprocess.Popen("./txtfind < ../find_input.txt", shell=True)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("txtfind failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't run txtfind.")
        print(inst)
        exit(1)

if __name__ == "__main__":
    main()
