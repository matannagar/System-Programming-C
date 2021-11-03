
all: isort txtfind

isort: isort.o 
	gcc -Wall -g -o isort isort.o

isort.o: isort.c
	gcc -Wall -g -c isort.c

txtfind: txtfind.o
	gcc -Wall -g -o txtfind txtfind.o

txtfind.o: txtfind.c
	gcc -Wall -g -c txtfind.c
	


.PHONY: clean all
clean:
	rm -f *.o *.a *.so *.exe txtfind isort
=======
FLAGS = -Wall -g
CC = gcc


all: main1

main1: frequency.o 
	$(CC) $(FLAGS) frequency.o -o frequency

frequency.o: frequency.c
	$(CC) $(FLAGS) -c frequency.c -o frequency.o



.PHONY: clean all

clean:
	rm -f *.o *.a *.so *.exe frequency

