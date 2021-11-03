import glob, os , sys
import shutil
import subprocess
import re
import filecmp


def pars_input():
    submission_file = sys.argv[1]
    print(submission_file)
    f= open(submission_file,"r")
    for line in f.readlines():
        if re.search(r'\.git', line):
            git_rep = line
            continue
        if re.search(r"\b\d{9}[\s_\\Z]", line):
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
        print("checking out you commit: " + commit)
        proc = subprocess.Popen("git checkout " + commit, shell=True, stdout=subprocess.PIPE , stderr=subprocess.PIPE)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("checkout failed p.returncode= " + str(proc.returncode))
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
        print("running: ./frequency < ../input.txt > ../frequency_output.txt" )
        proc = subprocess.Popen("./frequency < ../input.txt > ../frequency_output.txt", shell=True)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("frequency failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't run frequency.")
        print(inst)
        exit(1)

    try:
        print("running: ./frequency r < ../input.txt > ../frequency_r_output.txt" )
        proc = subprocess.Popen("./frequency r < ../input.txt > ../frequency_r_output.txt", shell=True)
        proc.wait()
        if proc.returncode != 0:
           raise Exception("frequency r failed p.returncode= " + str(proc.returncode))
    except Exception as inst:
        print("can't run frequency r.")
        print(inst)
        exit(1)

    is_err = False
    if not filecmp.cmp('../frequency_r_output.txt', '../frequency_r_expected.txt'):
        print("difference found in frequency_r_output.txt vs frequency_r_expected.txt")
        is_err = True

    if not filecmp.cmp('../frequency_output.txt', '../frequency_expected.txt'):
        print("difference found in frequency_output.txt vs frequency_expected.txt")
        is_err = True

    if not is_err:
        print("All if good")
    else:
        print("some difference found. please check")

if __name__ == "__main__":
    main()
